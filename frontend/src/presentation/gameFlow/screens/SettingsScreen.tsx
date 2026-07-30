import { useState } from "react";
import { useSettingsStore, type GraphicsQuality } from "@/presentation/settings/settingsStore";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { ControlsScreen } from "./ControlsScreen";

export interface SettingsScreenProps {
  readonly onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const settings = useSettingsStore();
  const gameplayServices = useGameplay();
  const [showControls, setShowControls] = useState(false);

  const toggleFullscreen = () => {
    const next = !settings.isFullscreen;
    settings.setFullscreen(next);
    if (next) {
      void document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen can be denied by the browser (e.g. no user gesture,
        // or already in another fullscreen context) — the setting still
        // reflects intent, it just won't take visible effect this time.
      });
    } else if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        // Best-effort, as above.
      });
    }
  };

  if (showControls) {
    return (
      <ControlsScreen
        onBack={() => {
          setShowControls(false);
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-shadow-valley">
      <h1 className="font-[var(--font-display)] text-3xl text-light-divine">Settings</h1>

      <div className="flex w-80 flex-col gap-5">
        <VolumeSlider
          label="Master Volume"
          value={settings.masterVolume}
          onChange={settings.setMasterVolume}
        />
        <VolumeSlider
          label="Music Volume"
          value={settings.musicVolume}
          onChange={settings.setMusicVolume}
        />
        <label className="flex items-center justify-between text-sm text-garden-300">
          Mute Music
          <input
            type="checkbox"
            checked={settings.isMusicMuted}
            onChange={(event) => {
              settings.setMusicMuted(event.target.checked);
            }}
          />
        </label>
        <VolumeSlider label="SFX Volume" value={settings.sfxVolume} onChange={settings.setSfxVolume} />
        <VolumeSlider
          label="Voice Volume"
          value={settings.voiceVolume}
          onChange={settings.setVoiceVolume}
        />
        <VolumeSlider
          label="Ambient Volume"
          value={settings.ambientVolume}
          onChange={settings.setAmbientVolume}
        />
        <VolumeSlider
          label="Mouse Sensitivity"
          value={settings.mouseSensitivity}
          min={0.1}
          max={3}
          onChange={settings.setMouseSensitivity}
        />

        <label className="flex flex-col gap-1 text-sm text-garden-300">
          Graphics Quality
          <select
            value={settings.graphicsQuality}
            onChange={(event) => {
              settings.setGraphicsQuality(event.target.value as GraphicsQuality);
            }}
            className="rounded border border-garden-700 bg-black/40 px-2 py-1 text-light-divine"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </label>

        <label className="flex items-center justify-between text-sm text-garden-300">
          Fullscreen
          <input type="checkbox" checked={settings.isFullscreen} onChange={toggleFullscreen} />
        </label>

        <h2 className="mt-2 text-xs font-semibold uppercase tracking-wide text-garden-500">
          Accessibility
        </h2>

        <label className="flex items-center justify-between text-sm text-garden-300">
          Large Text Mode
          <input
            type="checkbox"
            checked={settings.largeTextMode}
            onChange={(event) => {
              settings.setLargeTextMode(event.target.checked);
            }}
          />
        </label>
        <label className="flex items-center justify-between text-sm text-garden-300">
          Subtitles
          <input
            type="checkbox"
            checked={settings.subtitlesEnabled}
            onChange={(event) => {
              settings.setSubtitlesEnabled(event.target.checked);
            }}
          />
        </label>
        <label className="flex items-center justify-between text-sm text-garden-300">
          Reduce Motion
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(event) => {
              settings.setReduceMotion(event.target.checked);
            }}
          />
        </label>
        <label className="flex items-center justify-between text-sm text-garden-300">
          Crosshair
          <input
            type="checkbox"
            checked={settings.crosshairEnabled}
            onChange={(event) => {
              settings.setCrosshairEnabled(event.target.checked);
            }}
          />
        </label>
        <label className="flex items-center justify-between text-sm text-garden-300">
          Invert Y (Camera)
          <input
            type="checkbox"
            checked={settings.invertY}
            onChange={(event) => {
              settings.setInvertY(event.target.checked);
            }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-garden-300">
          Colorblind Mode
          <select
            value={settings.colorblindMode}
            onChange={(event) => {
              settings.setColorblindMode(event.target.value as typeof settings.colorblindMode);
            }}
            className="rounded border border-garden-700 bg-black/40 px-2 py-1 text-light-divine"
          >
            <option value="none">None</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="protanopia">Protanopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={() => {
          setShowControls(true);
        }}
        className="rounded border border-garden-700 px-4 py-1.5 text-sm text-light-divine hover:border-garden-500"
      >
        Controls…
      </button>

      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Dev only: erase all saved progress (StoryFlags, quests, inventory) and reload? This cannot be undone."
              )
            ) {
              gameplayServices.saveManager
                .clearSave()
                .then(() => {
                  window.location.reload();
                })
                .catch((error: unknown) => {
                  console.error("[SettingsScreen] Dev save reset failed:", error);
                });
            }
          }}
          className="rounded border border-red-800 px-4 py-1.5 text-sm text-red-300 hover:border-red-500 hover:text-red-200"
        >
          [Dev] Reset Save Data
        </button>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={settings.resetToDefaults}
          className="rounded border border-garden-700 px-3 py-1.5 text-sm text-garden-300 hover:text-light-divine"
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-garden-700 px-3 py-1.5 text-sm text-light-divine hover:border-garden-500"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
}: {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-garden-300">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-xs">{Math.round((value / max) * 100)}%</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
      />
    </label>
  );
}
