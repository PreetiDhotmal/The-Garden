import { useRef, useState } from "react";

const STICK_MAX_RADIUS = 44;
const BASE_DIAMETER = 120;
const STICK_DIAMETER = 56;

export interface VirtualJoystickProps {
  /** x/z each -1..1, analog strength included (not just a boolean direction). */
  readonly onMove: (x: number, z: number) => void;
}

/**
 * A real, visible analog joystick - not a decorative graphic. Tracks
 * its own touch by identifier (so it doesn't fight TouchCameraArea's
 * touch on the other side of the screen), reports normalized
 * displacement every move, and recenters immediately on release.
 */
export function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const activeTouchId = useRef<number | null>(null);
  const baseRef = useRef<HTMLDivElement | null>(null);

  const updateFromTouch = (touch: React.Touch) => {
    const base = baseRef.current;
    if (!base) {
      return;
    }
    const bounds = base.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const clampedDistance = Math.min(distance, STICK_MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * clampedDistance;
    const clampedY = Math.sin(angle) * clampedDistance;
    setStickOffset({ x: clampedX, y: clampedY });
    // Forward is -z in this project's world convention (matching
    // TouchInputSource's own dy < 0 => moveForward), and normalized
    // to -1..1 by dividing out the max radius - true analog strength,
    // not just a boolean direction.
    onMove(clampedX / STICK_MAX_RADIUS, clampedY / STICK_MAX_RADIUS);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (activeTouchId.current !== null) {
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    activeTouchId.current = touch.identifier;
    updateFromTouch(touch);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.identifier === activeTouchId.current) {
        updateFromTouch(touch);
        return;
      }
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setStickOffset({ x: 0, y: 0 });
        onMove(0, 0);
        return;
      }
    }
  };

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: "fixed",
        left: "calc(24px + env(safe-area-inset-left))",
        bottom: "calc(24px + env(safe-area-inset-bottom))",
        width: BASE_DIAMETER,
        height: BASE_DIAMETER,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        border: "2px solid rgba(255,255,255,0.35)",
        touchAction: "none",
        zIndex: 40,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          left: BASE_DIAMETER / 2 - STICK_DIAMETER / 2 + stickOffset.x,
          top: BASE_DIAMETER / 2 - STICK_DIAMETER / 2 + stickOffset.y,
          width: STICK_DIAMETER,
          height: STICK_DIAMETER,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.55)",
          border: "2px solid rgba(255,255,255,0.8)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
