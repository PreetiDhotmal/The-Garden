import { describe, expect, it } from "vitest";
import { createSceneId, InvalidSceneIdError, sceneIdsEqual, sceneIdToString } from "./SceneId";

describe("createSceneId", () => {
  it("creates a scene id with a valid kebab-case area", () => {
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    expect(sceneId).toEqual({ world: "GARDEN_OF_BEGINNINGS", area: "eastern-grove" });
  });

  it("rejects an empty area", () => {
    expect(() => createSceneId("GARDEN_OF_BEGINNINGS", "  ")).toThrow(InvalidSceneIdError);
  });

  it("rejects an area with invalid characters", () => {
    expect(() => createSceneId("GARDEN_OF_BEGINNINGS", "Eastern Grove!")).toThrow(
      InvalidSceneIdError
    );
  });
});

describe("sceneIdToString", () => {
  it("produces a stable, unique string per scene", () => {
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    expect(sceneIdToString(sceneId)).toBe("GARDEN_OF_BEGINNINGS:eastern-grove");
  });
});

describe("sceneIdsEqual", () => {
  it("returns true for matching world and area", () => {
    const a = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    const b = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    expect(sceneIdsEqual(a, b)).toBe(true);
  });

  it("returns false when either field differs", () => {
    const a = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    const b = createSceneId("GARDEN_OF_BEGINNINGS", "western-grove");
    expect(sceneIdsEqual(a, b)).toBe(false);
  });
});
