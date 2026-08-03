import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { EngineSmokeTestScene } from "@/presentation/engine/components/EngineSmokeTestScene";
import { DebugPanel } from "@/presentation/engine/components/DebugPanel";

/**
 * Exercises every engine system end-to-end (renderer, physics,
 * lighting, scene/camera registration, render loop, dev tools) with a
 * trivial ground-plane-and-cube scene. This route exists to prove the
 * Milestone 2 engine foundation actually works at runtime, not to
 * serve as a game screen — no player, no NPCs, no quest content.
 */
export function EnginePreviewPage() {
  return (
    <EngineProvider>
      <div className="h-full w-full">
        <GameCanvas>
          <EngineSmokeTestScene />
        </GameCanvas>
        <DebugPanel />
      </div>
    </EngineProvider>
  );
}
