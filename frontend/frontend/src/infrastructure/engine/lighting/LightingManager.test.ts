import { AmbientLight, Color, DirectionalLight, Fog, Scene } from "three";
import { describe, expect, it } from "vitest";
import { createEnvironmentConfig } from "@/domain/engine/config/EnvironmentConfig";
import { LightingManager } from "./LightingManager";

describe("LightingManager", () => {
  it("adds a directional and ambient light to the scene", () => {
    const scene = new Scene();
    const manager = new LightingManager();
    const config = createEnvironmentConfig({ id: "garden-day" });

    const { directionalLight, ambientLight } = manager.applyToScene(scene, config);

    expect(scene.children).toContain(directionalLight);
    expect(scene.children).toContain(ambientLight);
    expect(directionalLight).toBeInstanceOf(DirectionalLight);
    expect(ambientLight).toBeInstanceOf(AmbientLight);
  });

  it("sets the scene background from config", () => {
    const scene = new Scene();
    const manager = new LightingManager();
    const config = createEnvironmentConfig({ id: "garden-day", backgroundColorHex: "#112233" });

    manager.applyToScene(scene, config);

    expect((scene.background as Color).getHexString()).toBe("112233");
  });

  it("applies fog when configured, and null when not", () => {
    const scene = new Scene();
    const manager = new LightingManager();

    manager.applyToScene(
      scene,
      createEnvironmentConfig({
        id: "foggy",
        fog: { colorHex: "#cccccc", near: 5, far: 50 },
      })
    );
    expect(scene.fog).not.toBeNull();
    expect(scene.fog).toBeInstanceOf(Fog);
    const fog = scene.fog as Fog;
    expect(fog.near).toBe(5);
    expect(fog.far).toBe(50);

    manager.applyToScene(scene, createEnvironmentConfig({ id: "clear" }));
    expect(scene.fog).toBeNull();
  });

  it("removes previously applied lights before applying new ones", () => {
    const scene = new Scene();
    const manager = new LightingManager();

    manager.applyToScene(scene, createEnvironmentConfig({ id: "first" }));
    const lightCountAfterFirst = scene.children.filter(
      (child) => child instanceof DirectionalLight || child instanceof AmbientLight
    ).length;

    manager.applyToScene(scene, createEnvironmentConfig({ id: "second" }));
    const lightCountAfterSecond = scene.children.filter(
      (child) => child instanceof DirectionalLight || child instanceof AmbientLight
    ).length;

    expect(lightCountAfterFirst).toBe(lightCountAfterSecond);
  });

  it("enables shadows on the directional light when configured", () => {
    const scene = new Scene();
    const manager = new LightingManager();
    const config = createEnvironmentConfig({
      id: "shadowed",
      directionalLight: { castShadow: true },
    });

    const { directionalLight } = manager.applyToScene(scene, config);

    expect(directionalLight.castShadow).toBe(true);
  });
});
