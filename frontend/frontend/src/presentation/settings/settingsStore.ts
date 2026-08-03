import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Capacitor } from "@capacitor/core";

export type GraphicsQuality = "low" | "medium" | "high" | "ultra";
export type Difficulty = "easy" | "normal" | "hard";
export type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia";

export const MAX_HEALTH_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  easy: 150,
  normal: 100,
  hard: 75,
};

export interface GameSettings {
  readonly masterVolume: number;
  readonly musicVolume: number;
  readonly isMusicMuted: boolean;
  readonly sfxVolume: number;
  readonly voiceVolume: number;
  readonly ambientVolume: number;
  readonly mouseSensitivity: number;
  readonly graphicsQuality: GraphicsQuality;
  readonly isFullscreen: boolean;
  readonly difficulty: Difficulty;
  readonly largeTextMode: boolean;
  readonly subtitlesEnabled: boolean;
  readonly reduceMotion: boolean;
  readonly crosshairEnabled: boolean;
  readonly invertY: boolean;
  readonly colorblindMode: ColorblindMode;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  masterVolume: 1,
  musicVolume: 0.55,
  isMusicMuted: false,
  sfxVolume: 0.8,
  voiceVolume: 0.8,
  ambientVolume: 0.8,
  mouseSensitivity: 1,
  graphicsQuality: Capacitor.isNativePlatform() ? "low" : "high",
  isFullscreen: false,
  difficulty: "normal",
  largeTextMode: false,
  subtitlesEnabled: true,
  reduceMotion: false,
  crosshairEnabled: false,
  invertY: false,
  colorblindMode: "none",
};

interface SettingsState extends GameSettings {
  setMasterVolume: (value: number) => void;
  setMusicVolume: (value: number) => void;
  setMusicMuted: (value: boolean) => void;
  setSfxVolume: (value: number) => void;
  setVoiceVolume: (value: number) => void;
  setAmbientVolume: (value: number) => void;
  setMouseSensitivity: (value: number) => void;
  setGraphicsQuality: (value: GraphicsQuality) => void;
  setFullscreen: (value: boolean) => void;
  setDifficulty: (value: Difficulty) => void;
  setLargeTextMode: (value: boolean) => void;
  setSubtitlesEnabled: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setCrosshairEnabled: (value: boolean) => void;
  setInvertY: (value: boolean) => void;
  setColorblindMode: (value: ColorblindMode) => void;
  resetToDefaults: () => void;
}

/** Key bindings live in a separate store (keyBindingsStore) — a different persistence shape (action -> key overrides vs. plain values here), not a design gap. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_GAME_SETTINGS,
      setMasterVolume: (value) => {
        set({ masterVolume: Math.max(0, Math.min(1, value)) });
      },
      setMusicVolume: (value) => {
        set({ musicVolume: Math.max(0, Math.min(1, value)) });
      },
      setMusicMuted: (value) => {
        set({ isMusicMuted: value });
      },
      setSfxVolume: (value) => {
        set({ sfxVolume: Math.max(0, Math.min(1, value)) });
      },
      setVoiceVolume: (value) => {
        set({ voiceVolume: Math.max(0, Math.min(1, value)) });
      },
      setAmbientVolume: (value) => {
        set({ ambientVolume: Math.max(0, Math.min(1, value)) });
      },
      setMouseSensitivity: (value) => {
        set({ mouseSensitivity: Math.max(0.1, Math.min(3, value)) });
      },
      setGraphicsQuality: (value) => {
        set({ graphicsQuality: value });
      },
      setFullscreen: (value) => {
        set({ isFullscreen: value });
      },
      setDifficulty: (value) => {
        set({ difficulty: value });
      },
      setLargeTextMode: (value) => {
        set({ largeTextMode: value });
      },
      setSubtitlesEnabled: (value) => {
        set({ subtitlesEnabled: value });
      },
      setReduceMotion: (value) => {
        set({ reduceMotion: value });
      },
      setCrosshairEnabled: (value) => {
        set({ crosshairEnabled: value });
      },
      setInvertY: (value) => {
        set({ invertY: value });
      },
      setColorblindMode: (value) => {
        set({ colorblindMode: value });
      },
      resetToDefaults: () => {
        set(DEFAULT_GAME_SETTINGS);
      },
    }),
    {
      name: "the-garden:settings",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameSettings> | undefined;
        const merged = { ...currentState, ...persisted };
        const isValidVolume = (value: unknown): value is number =>
          typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
        if (!isValidVolume(persisted?.musicVolume)) {
          merged.musicVolume = DEFAULT_GAME_SETTINGS.musicVolume;
        }
        if (typeof persisted?.isMusicMuted !== "boolean") {
          merged.isMusicMuted = DEFAULT_GAME_SETTINGS.isMusicMuted;
        }
        return merged;
      },
    }
  )
);
