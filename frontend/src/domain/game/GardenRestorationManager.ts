import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import {
  DORMANT_RESTORATION_PROFILE,
  mergeRestorationProfiles,
  type RestorationProfile,
} from "./RestorationProfile";

export interface ChapterRestorationEntry {
  readonly chapterId: string;
  /** Which Hub zone this chapter's completion restores — the GDD's one-chapter-to-one-zone mapping. */
  readonly zoneId: string;
  readonly profile: RestorationProfile;
}

/**
 * Purely data-driven, per the brief: this class contains no
 * per-category if-statements anywhere. Restoring a zone is always
 * "look up the registered profile for this chapter, merge it into
 * the zone's current profile" — the same one code path regardless of
 * whether the change involves flowers, water, lighting, or all of
 * them, because RestorationProfile's merge function (max of every
 * field) already generalizes across every category.
 */
export class GardenRestorationManager {
  private readonly entriesByChapterId = new Map<string, ChapterRestorationEntry>();
  private readonly profileByZoneId = new Map<string, RestorationProfile>();

  constructor(private readonly eventBus: GameplayEventBus) {}

  register(entry: ChapterRestorationEntry): void {
    this.entriesByChapterId.set(entry.chapterId, entry);
  }

  registerAll(entries: readonly ChapterRestorationEntry[]): void {
    for (const entry of entries) {
      this.register(entry);
    }
  }

  /** The zone's current restoration state, or the dormant baseline if it's never been restored at all. */
  getZoneProfile(zoneId: string): RestorationProfile {
    return this.profileByZoneId.get(zoneId) ?? DORMANT_RESTORATION_PROFILE;
  }

  /** Applies the given chapter's registered profile to its zone (merged, never regressing) and emits garden:restored. Idempotent. */
  applyChapterCompletion(chapterId: string): void {
    const entry = this.entriesByChapterId.get(chapterId);
    if (!entry) {
      return;
    }
    const current = this.getZoneProfile(entry.zoneId);
    const merged = mergeRestorationProfiles(current, entry.profile);
    this.profileByZoneId.set(entry.zoneId, merged);
    this.eventBus.emit("garden:restored", { chapterId });
  }

  /**
   * Loads a zone's profile directly, bypassing the chapter-completion
   * pathway — for restoring PlayerSave.gardenRestoration on load, where
   * nothing is actually being completed again, only replayed. Still
   * merges (never regresses) rather than overwriting, consistent with
   * every other mutation on this class, in case a zone was already
   * partially restored this session before the save loaded.
   */
  restoreZoneProfile(zoneId: string, profile: RestorationProfile): void {
    const current = this.getZoneProfile(zoneId);
    this.profileByZoneId.set(zoneId, mergeRestorationProfiles(current, profile));
  }

  /** Every zone that has ever received any restoration, with its current profile. */
  listRestoredZones(): readonly { zoneId: string; profile: RestorationProfile }[] {
    return Array.from(this.profileByZoneId.entries()).map(([zoneId, profile]) => ({
      zoneId,
      profile,
    }));
  }

  /** A single 0..1 scalar across every registered zone's every numeric category — not primary UI (GDD 3.12 keeps the Hub's visuals as the primary indicator) but available for e.g. achievement checks. */
  getOverallRestorationScalar(): number {
    const zones = this.listRestoredZones();
    if (zones.length === 0) {
      return 0;
    }
    const numericFieldsPerZone = zones.map(({ profile }) => {
      const values = [
        profile.flowerDensity,
        profile.treeCanopyDensity,
        profile.waterLevel,
        profile.animalPresence,
        profile.lightingWarmth,
        profile.particleDensity,
        profile.bridgeStable ? 1 : 0,
      ];
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    });
    return (
      numericFieldsPerZone.reduce((sum, value) => sum + value, 0) / numericFieldsPerZone.length
    );
  }
}
