import type { AnimationClipRegistry } from "@/domain/character/animation/AnimationClipRegistry";
import type { CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";
import { useDebugSettingsStore } from "@/presentation/engine/stores/debugSettingsStore";

export interface AnimationDebugPanelProps {
  readonly clipRegistry: AnimationClipRegistry;
  readonly animationConfig: CharacterAnimationConfig;
}

export function AnimationDebugPanel({ clipRegistry, animationConfig }: AnimationDebugPanelProps) {
  const isDebugPanelOpen = useDebugSettingsStore((state) => state.isPanelOpen);

  if (!import.meta.env.DEV || !isDebugPanelOpen) {
    return null;
  }

  return (
    <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="rounded bg-yellow-900/60 p-2 text-yellow-200">
        ⚠ Role→clip mapping is a provisional, duration-based guess — not visually verified. Preview
        each clip below and correct the mapping in
        infrastructure/character/defaultAnimationConfigs.ts.
      </div>

      <div className="font-semibold text-garden-300">Discovered clips ({clipRegistry.size()})</div>
      <table className="w-full">
        <thead>
          <tr className="text-left text-garden-300">
            <th className="pr-2">clip</th>
            <th className="pr-2">duration</th>
            <th>tracks</th>
          </tr>
        </thead>
        <tbody>
          {clipRegistry.list().map((clip) => (
            <tr key={clip.name}>
              <td className="pr-2">{clip.name}</td>
              <td className="pr-2">{clip.durationSeconds.toFixed(2)}s</td>
              <td>{clip.trackCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 font-semibold text-garden-300">Role mapping</div>
      <table className="w-full">
        <thead>
          <tr className="text-left text-garden-300">
            <th className="pr-2">role</th>
            <th className="pr-2">clip</th>
            <th>loop</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(animationConfig.mappings.values()).map((mapping) => (
            <tr key={mapping.role}>
              <td className="pr-2">{mapping.role}</td>
              <td className="pr-2">{mapping.clipName}</td>
              <td>{mapping.loop ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
