import { useContext } from "react";
import { GameFrameworkContext, type GameFrameworkServices } from "../GameFrameworkContext";

export function useGameFramework(): GameFrameworkServices {
  const services = useContext(GameFrameworkContext);
  if (!services) {
    throw new Error("useGameFramework() was called outside of a <GameFrameworkProvider>.");
  }
  return services;
}
