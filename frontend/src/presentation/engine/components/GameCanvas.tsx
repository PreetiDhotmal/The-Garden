import { type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useDebugSettingsStore } from "../stores/debugSettingsStore";
import { useRenderLoop } from "../hooks/useRenderLoop";

export interface GameCanvasProps {
  readonly children: ReactNode;
  readonly gravity?: readonly [number, number, number];
}

/**
 * Mounted inside `<Canvas>`; exists solely so `useRenderLoop` (which
 * requires R3F's `useFrame`) has somewhere to run without forcing
 * every scene-content component to remember to call it themselves.
 */
function RenderLoopDriver() {
  useRenderLoop();
  return null;
}

/**
 * The engine's single Canvas root. Configures the renderer for the
 * cinematic, naturalistic look the game targets (ACES filmic tone
 * mapping, sRGB output, soft shadows) and wraps children in the
 * Rapier physics world. Contains no gameplay, geometry, lighting, or
 * camera content itself — those are composed by callers as children,
 * keeping this component reusable across every scene.
 */
export function GameCanvas({ children, gravity = [0, -9.81, 0] }: GameCanvasProps) {
  const isPhysicsDebugEnabled = useDebugSettingsStore((state) => state.isPhysicsDebugEnabled);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: SRGBColorSpace,
        antialias: true,
      }}
    >
      <RenderLoopDriver />
      <Physics gravity={[...gravity]} debug={isPhysicsDebugEnabled}>
        {children}
      </Physics>
    </Canvas>
  );
}
