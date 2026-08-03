export interface ActionButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  /** Called on touch-start too (for hold-style actions like sprint), not just a click. */
  readonly onRelease?: () => void;
  readonly size?: number;
  readonly style?: React.CSSProperties;
}

const DEFAULT_SIZE = 64;

/**
 * A real, functional touch button - not decoration. Uses touch
 * events directly (not onClick) so it responds immediately on
 * touchstart, matching how a physical game button feels, and so
 * onRelease can back "held" actions like sprint.
 */
export function ActionButton({ label, onPress, onRelease, size = DEFAULT_SIZE, style }: ActionButtonProps) {
  return (
    <button
      type="button"
      onTouchStart={(event) => {
        event.preventDefault();
        onPress();
      }}
      onTouchEnd={(event) => {
        event.preventDefault();
        onRelease?.();
      }}
      onTouchCancel={(event) => {
        event.preventDefault();
        onRelease?.();
      }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.18)",
        border: "2px solid rgba(255,255,255,0.4)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        touchAction: "none",
        ...style,
      }}
    >
      {label}
    </button>
  );
}
