import type { MobileMovementInputSource } from "@/infrastructure/input/MobileMovementInputSource";
import type { MobileButtonInputSource } from "@/infrastructure/input/MobileButtonInputSource";
import { VirtualJoystick } from "./VirtualJoystick";
import { TouchCameraArea } from "./TouchCameraArea";
import { ActionButton } from "./ActionButton";

export interface MobileControlsProps {
  readonly movementSource: MobileMovementInputSource;
  readonly buttonSource: MobileButtonInputSource;
  /** Interaction radius/prompt is driven by the same InteractionManager keyboard's "E" already triggers - this button is a second way to fire the identical action, not a separate mechanic. */
  readonly onInteract?: () => void;
}

/**
 * The single mount point for all mobile touch controls. Renders
 * nothing but real, functional controls wired to the exact
 * InputSource instances the parent scene registered with
 * InputSystem - pressing these buttons or dragging these areas
 * produces the same InputFrameState fields keyboard/mouse do, so the
 * character controller and interaction system need no mobile-specific
 * branch at all.
 */
export function MobileControls({ movementSource, buttonSource, onInteract }: MobileControlsProps) {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }}>
      <div style={{ pointerEvents: "auto" }}>
        <VirtualJoystick
          onMove={(x, z) => {
            movementSource.setMoveVector(x, z);
          }}
        />
        <TouchCameraArea
          onLook={(deltaX, deltaY) => {
            movementSource.addLookDelta(deltaX, deltaY);
          }}
        />
      </div>

      <div
        style={{
          position: "fixed",
          right: "calc(20px + env(safe-area-inset-right))",
          bottom: "calc(20px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 12,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <ActionButton
            label="Sprint"
            size={56}
            onPress={() => {
              buttonSource.setSprintHeld(true);
            }}
            onRelease={() => {
              buttonSource.setSprintHeld(false);
            }}
          />
          <ActionButton
            label="Jump"
            size={56}
            onPress={() => {
              buttonSource.triggerJump();
            }}
          />
        </div>
        <ActionButton
          label="Interact"
          size={76}
          style={{ background: "rgba(201,168,76,0.35)", border: "2px solid rgba(201,168,76,0.8)" }}
          onPress={() => {
            buttonSource.triggerInteract();
            onInteract?.();
          }}
        />
      </div>
    </div>
  );
}
