import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 500;

/** How many gamepads the browser currently reports as connected — polls the same navigator.getGamepads() API GamepadInputSource already uses, purely for UI display here rather than actual input routing. */
export function useConnectedGamepadCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const poll = () => {
      const gamepads = navigator.getGamepads();
      const connectedCount = Array.from(gamepads).filter((gamepad) => gamepad !== null).length;
      setCount(connectedCount);
    };
    poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return count;
}
