import { useContext } from "react";
import { GameplayContext, type GameplayServices } from "../providers/GameplayContext";

export function useGameplay(): GameplayServices {
  const services = useContext(GameplayContext);
  if (!services) {
    throw new Error("useGameplay() was called outside of a <GameplayProvider>.");
  }
  return services;
}
