import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { StoryFlags } from "@/domain/gameplay/progression/StoryFlags";
import { ReflectionContentRegistry } from "./ReflectionContent";
import { ReflectionManager } from "./ReflectionManager";

function buildManager() {
  const contentRegistry = new ReflectionContentRegistry();
  contentRegistry.register({
    levelId: "level:communication",
    lessonText: "Understanding takes both a voice and an ear.",
    summaryText: "You restored the aqueduct together.",
    scriptureReference: null,
  });
  const storyFlags = new StoryFlags();
  const eventBus = createGameplayEventBus();
  const manager = new ReflectionManager(contentRegistry, storyFlags, eventBus);
  return { manager, storyFlags, eventBus };
}

describe("ReflectionManager", () => {
  it("a level's reflection has not been watched before it's ever shown", () => {
    const { manager } = buildManager();
    expect(manager.hasBeenWatched("level:communication")).toBe(false);
  });

  it("shouldForceWatch is true the first time (skip is not offered)", () => {
    const { manager } = buildManager();
    expect(manager.shouldForceWatch("level:communication")).toBe(true);
  });

  it("shouldForceWatch becomes false once markWatched has been called (replays can skip)", () => {
    const { manager } = buildManager();
    manager.markWatched("level:communication");
    expect(manager.shouldForceWatch("level:communication")).toBe(false);
  });

  it("hasBeenWatched persists via the same StoryFlags instance used for save/load", () => {
    const { manager, storyFlags } = buildManager();
    manager.markWatched("level:communication");
    const restoredFlags = new StoryFlags();
    restoredFlags.restore(storyFlags.list());
    const restoredManager = new ReflectionManager(
      new ReflectionContentRegistry(),
      restoredFlags,
      createGameplayEventBus()
    );
    expect(restoredManager.hasBeenWatched("level:communication")).toBe(true);
  });

  it("open emits reflection:opened for the given level", () => {
    const { manager, eventBus } = buildManager();
    const listener = vi.fn();
    eventBus.on("reflection:opened", listener);

    manager.open("level:communication");

    expect(listener).toHaveBeenCalledWith({ levelId: "level:communication" });
  });

  it("close emits reflection:closed for the given level", () => {
    const { manager, eventBus } = buildManager();
    const listener = vi.fn();
    eventBus.on("reflection:closed", listener);

    manager.close("level:communication");

    expect(listener).toHaveBeenCalledWith({ levelId: "level:communication" });
  });

  it("getContent delegates to the underlying registry", () => {
    const { manager } = buildManager();
    expect(manager.getContent("level:communication").summaryText).toBe(
      "You restored the aqueduct together."
    );
  });

  it("watched state is tracked independently per level", () => {
    const { manager } = buildManager();
    manager.markWatched("level:communication");
    expect(manager.hasBeenWatched("level:trust")).toBe(false);
  });
});
