import { useRef } from "react";

const LOOK_SENSITIVITY = 0.004;

export interface TouchCameraAreaProps {
  readonly onLook: (deltaX: number, deltaY: number) => void;
}

/**
 * Covers the right half of the screen (left half is reserved for
 * VirtualJoystick - MobileControls positions these so they never
 * overlap). A drag here accumulates a camera look delta, exactly like
 * a mouse-look drag on desktop, converted to the same lookDeltaX/
 * lookDeltaY the desktop MouseInputSource already produces.
 */
export function TouchCameraArea({ onLook }: TouchCameraAreaProps) {
  const activeTouchId = useRef<number | null>(null);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (activeTouchId.current !== null) {
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    activeTouchId.current = touch.identifier;
    lastPosition.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.identifier === activeTouchId.current && lastPosition.current) {
        const deltaX = -(touch.clientX - lastPosition.current.x) * LOOK_SENSITIVITY;
        const deltaY = -(touch.clientY - lastPosition.current.y) * LOOK_SENSITIVITY;
        onLook(deltaX, deltaY);
        lastPosition.current = { x: touch.clientX, y: touch.clientY };
        return;
      }
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.identifier === activeTouchId.current) {
        activeTouchId.current = null;
        lastPosition.current = null;
        return;
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 140,
        width: "55%",
        touchAction: "none",
        zIndex: 20,
      }}
      aria-hidden="true"
    />
  );
}
