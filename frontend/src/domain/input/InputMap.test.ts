import { describe, expect, it } from "vitest";
import { InputAction } from "./InputAction";
import { createDefaultInputMap, InputMap } from "./InputMap";

describe("InputMap", () => {
  it("resolves a bound physical input to its action", () => {
    const map = createDefaultInputMap();
    expect(map.resolveAction("keyboard", "KeyW")).toBe(InputAction.MOVE_FORWARD);
  });

  it("returns null for an unbound physical input", () => {
    const map = createDefaultInputMap();
    expect(map.resolveAction("keyboard", "KeyQ")).toBeNull();
  });

  it("supports multiple physical inputs mapping to the same action", () => {
    const map = createDefaultInputMap();
    expect(map.resolveAction("keyboard", "KeyW")).toBe(InputAction.MOVE_FORWARD);
    expect(map.resolveAction("keyboard", "ArrowUp")).toBe(InputAction.MOVE_FORWARD);
  });

  it("rebinds an action to a new physical input", () => {
    const map = new InputMap();
    map.rebind(InputAction.JUMP, "keyboard", "Enter");

    expect(map.resolveAction("keyboard", "Enter")).toBe(InputAction.JUMP);
  });

  it("clears the old binding when an action is rebound on the same device", () => {
    const map = createDefaultInputMap();
    map.rebind(InputAction.JUMP, "keyboard", "Enter");

    expect(map.resolveAction("keyboard", "Space")).toBeNull();
    expect(map.resolveAction("keyboard", "Enter")).toBe(InputAction.JUMP);
  });

  it("lists every binding for a given action", () => {
    const map = createDefaultInputMap();
    const bindings = map.listBindingsForAction(InputAction.MOVE_FORWARD);
    expect(bindings.map((b) => b.physicalInput).sort()).toEqual(["ArrowUp", "KeyW"]);
  });
});
