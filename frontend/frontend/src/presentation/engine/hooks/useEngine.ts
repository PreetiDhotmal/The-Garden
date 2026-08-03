import { useContext } from "react";
import { EngineContext, type EngineServices } from "../providers/EngineContext";

export function useEngine(): EngineServices {
  const services = useContext(EngineContext);
  if (!services) {
    throw new Error("useEngine() was called outside of an <EngineProvider>.");
  }
  return services;
}
