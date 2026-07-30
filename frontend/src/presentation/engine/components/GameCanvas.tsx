import { type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useDebugSettingsStore } from "../stores/debugSettingsStore";
import { useRenderLoop } from "../hooks/useRenderLoop";
import { PostProcessingStack } from "@/presentation/world/components/PostProcessingStack";

export interface GameCanvasProps {
  readonly children: ReactNode;
  readonly gravity?: [number, number, number];
  /**
   * Stops R3F's entire frame loop (frameloop="never") — every
   * useFrame callback in the tree (player movement, animation
   * updates, NPC idle logic, particle systems, camera smoothing)
   * stops firing simultaneously, with zero changes needed to any of
   * those individual components. Physics is also explicitly paused
   * for clarity, though frameloop="never" already halts its stepping.
   */
  readonly isPaused?: boolean;
  /** Defaults to true (the previous hardcoded behavior) — Low quality turns this off for performance. */
  readonly antialias?: boolean;
  /**
   * Defaults to FALSE — deliberately opt-in, not opt-out.
   * PostProcessingStack's EffectComposer takes over R3F's default
   * per-frame render the same way SplitScreenRenderer's own
   * useFrame(..., 1) already does for its dual-camera scissor
   * rendering (see that component's docstring). Mounting both in the
   * same Canvas risks a real conflict — either post-processing renders
   * using the wrong (default) camera instead of either split-screen
   * camera, or split-screen's own render calls end up overriding
   * whatever EffectComposer produces, silently doing nothing. Given
   * "do not modify multiplayer" is an explicit constraint, this is
   * enabled only for confirmed single-camera routes (currently just
   * the Hub), not assumed safe everywhere.
   */
  readonly enablePostProcessing?: boolean;
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

const DEFAULT_GRAVITY: [number, number, number] = [0, -9.81, 0];

/**
 * The engine's single Canvas root. Configures the renderer for the
 * cinematic, naturalistic look the game targets (ACES filmic tone
 * mapping, sRGB output, soft shadows) and wraps children in the
 * Rapier physics world. Contains no gameplay, geometry, lighting, or
 * camera content itself — those are composed by callers as children,
 * keeping this component reusable across every scene.
 */
export function GameCanvas({
  children,
  gravity = DEFAULT_GRAVITY,
  isPaused = false,
  antialias = true,
  enablePostProcessing = false,
}: GameCanvasProps) {
  const isPhysicsDebugEnabled = useDebugSettingsStore((state) => state.isPhysicsDebugEnabled);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={isPaused ? "never" : "always"}
      gl={{
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        outputColorSpace: SRGBColorSpace,
        antialias,
      }}
    >
      <RenderLoopDriver />
      <Physics gravity={gravity} debug={isPhysicsDebugEnabled} paused={isPaused}>
        {children}
      </Physics>
      {enablePostProcessing && <PostProcessingStack />}
    </Canvas>
  );
}
