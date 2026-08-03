import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { DORMANT_RESTORATION_PROFILE } from "./RestorationProfile";
import { GardenRestorationManager } from "./GardenRestorationManager";

describe("GardenRestorationManager", () => {
  it("returns the dormant profile for a zone that has never been restored", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    expect(manager.getZoneProfile("zone:unknown")).toEqual(DORMANT_RESTORATION_PROFILE);
  });

  it("applies a registered chapter's profile to its zone", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    manager.register({
      chapterId: "chapter:communication",
      zoneId: "zone:aqueduct",
      profile: { ...DORMANT_RESTORATION_PROFILE, waterLevel: 1 },
    });

    manager.applyChapterCompletion("chapter:communication");

    expect(manager.getZoneProfile("zone:aqueduct").waterLevel).toBe(1);
  });

  it("merges rather than overwrites when multiple chapters restore the same zone", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    manager.registerAll([
      {
        chapterId: "chapter:a",
        zoneId: "zone:hub",
        profile: { ...DORMANT_RESTORATION_PROFILE, flowerDensity: 0.4 },
      },
      {
        chapterId: "chapter:b",
        zoneId: "zone:hub",
        profile: { ...DORMANT_RESTORATION_PROFILE, waterLevel: 0.7 },
      },
    ]);

    manager.applyChapterCompletion("chapter:a");
    manager.applyChapterCompletion("chapter:b");

    const profile = manager.getZoneProfile("zone:hub");
    expect(profile.flowerDensity).toBe(0.4);
    expect(profile.waterLevel).toBe(0.7);
  });

  it("is idempotent — applying the same chapter twice has no additional effect", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    manager.register({
      chapterId: "chapter:a",
      zoneId: "zone:hub",
      profile: { ...DORMANT_RESTORATION_PROFILE, flowerDensity: 0.5 },
    });

    manager.applyChapterCompletion("chapter:a");
    manager.applyChapterCompletion("chapter:a");

    expect(manager.getZoneProfile("zone:hub").flowerDensity).toBe(0.5);
  });

  it("does nothing for an unregistered chapter id", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    expect(() => {
      manager.applyChapterCompletion("chapter:unregistered");
    }).not.toThrow();
  });

  it("emits garden:restored on successful application", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("garden:restored", listener);
    const manager = new GardenRestorationManager(eventBus);
    manager.register({
      chapterId: "chapter:a",
      zoneId: "zone:hub",
      profile: DORMANT_RESTORATION_PROFILE,
    });

    manager.applyChapterCompletion("chapter:a");

    expect(listener).toHaveBeenCalledWith({ chapterId: "chapter:a" });
  });

  it("does not emit garden:restored for an unregistered chapter", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("garden:restored", listener);
    const manager = new GardenRestorationManager(eventBus);

    manager.applyChapterCompletion("chapter:unregistered");

    expect(listener).not.toHaveBeenCalled();
  });

  it("getOverallRestorationScalar is 0 with no restored zones", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    expect(manager.getOverallRestorationScalar()).toBe(0);
  });

  it("getOverallRestorationScalar increases as zones restore", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    manager.register({
      chapterId: "chapter:a",
      zoneId: "zone:hub",
      profile: {
        flowerDensity: 1,
        treeCanopyDensity: 1,
        waterLevel: 1,
        bridgeStable: true,
        musicLayerId: "layer:a",
        animalPresence: 1,
        lightingWarmth: 1,
        particleDensity: 1,
        unlockedAreaIds: [],
      },
    });

    manager.applyChapterCompletion("chapter:a");

    expect(manager.getOverallRestorationScalar()).toBe(1);
  });

  it("listRestoredZones only includes zones that have received at least one restoration", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    manager.register({
      chapterId: "chapter:a",
      zoneId: "zone:hub",
      profile: DORMANT_RESTORATION_PROFILE,
    });
    manager.applyChapterCompletion("chapter:a");
    expect(manager.listRestoredZones().map((z) => z.zoneId)).toEqual(["zone:hub"]);
  });

  it("restoreZoneProfile loads a profile directly, bypassing chapter registration entirely", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    manager.restoreZoneProfile("zone:unregistered", {
      ...DORMANT_RESTORATION_PROFILE,
      waterLevel: 1,
    });
    expect(manager.getZoneProfile("zone:unregistered").waterLevel).toBe(1);
  });

  it("restoreZoneProfile merges rather than overwrites an already-restored zone", () => {
    const manager = new GardenRestorationManager(createGameplayEventBus());
    manager.restoreZoneProfile("zone:hub", { ...DORMANT_RESTORATION_PROFILE, flowerDensity: 0.9 });
    manager.restoreZoneProfile("zone:hub", { ...DORMANT_RESTORATION_PROFILE, waterLevel: 0.5 });
    const profile = manager.getZoneProfile("zone:hub");
    expect(profile.flowerDensity).toBe(0.9);
    expect(profile.waterLevel).toBe(0.5);
  });

  it("restoreZoneProfile does not emit garden:restored — it is not a chapter completion", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("garden:restored", listener);
    const manager = new GardenRestorationManager(eventBus);

    manager.restoreZoneProfile("zone:hub", DORMANT_RESTORATION_PROFILE);

    expect(listener).not.toHaveBeenCalled();
  });
});
