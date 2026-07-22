import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { CameraManager, CameraNotRegisteredError } from "./CameraManager";

describe("CameraManager", () => {
  it("registers a camera and retrieves it by id", () => {
    const manager = new CameraManager();
    const camera = new PerspectiveCamera();

    manager.register("main", camera);

    expect(manager.get("main")).toBe(camera);
  });

  it("automatically activates the first registered camera", () => {
    const manager = new CameraManager();
    const camera = new PerspectiveCamera();
    manager.register("main", camera);

    expect(manager.getActiveId()).toBe("main");
    expect(manager.getActiveCamera()).toBe(camera);
  });

  it("does not change the active camera when a second one is registered", () => {
    const manager = new CameraManager();
    manager.register("main", new PerspectiveCamera());
    manager.register("debug", new PerspectiveCamera());

    expect(manager.getActiveId()).toBe("main");
  });

  it("switches the active camera explicitly", () => {
    const manager = new CameraManager();
    manager.register("main", new PerspectiveCamera());
    const debugCamera = new PerspectiveCamera();
    manager.register("debug", debugCamera);

    manager.setActive("debug");

    expect(manager.getActiveCamera()).toBe(debugCamera);
  });

  it("throws when activating an unregistered camera id", () => {
    const manager = new CameraManager();
    expect(() => {
      manager.setActive("missing");
    }).toThrow(CameraNotRegisteredError);
  });

  it("throws when getting an unregistered camera id", () => {
    const manager = new CameraManager();
    expect(() => manager.get("missing")).toThrow(CameraNotRegisteredError);
  });

  it("clears the active camera when it is unregistered", () => {
    const manager = new CameraManager();
    manager.register("main", new PerspectiveCamera());

    manager.unregister("main");

    expect(manager.getActiveId()).toBeNull();
    expect(manager.getActiveCamera()).toBeNull();
  });

  it("lists all registered camera ids", () => {
    const manager = new CameraManager();
    manager.register("main", new PerspectiveCamera());
    manager.register("debug", new PerspectiveCamera());

    expect(manager.listIds()).toEqual(["main", "debug"]);
  });
});
