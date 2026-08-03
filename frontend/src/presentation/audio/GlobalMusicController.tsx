import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "@/presentation/settings/settingsStore";

const MUSIC_SRC = "/audio/natureMusic.mp3";

interface MusicDiagnostics {
  readonly loaded: boolean;
  readonly playing: boolean;
  readonly error: string | null;
}

/**
 * Mount exactly once, above route/page switching (e.g. directly in
 * App.tsx, as a sibling of the router) - never inside a route
 * component, or it would be recreated on every navigation and the
 * music would restart, which is explicitly not wanted.
 *
 * Owns exactly one HTMLAudioElement for the entire app's lifetime,
 * created once via useRef + lazy initialization, never
 * useState/re-created on re-render.
 */
export function GlobalMusicController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [diagnostics, setDiagnostics] = useState<MusicDiagnostics>({
    loaded: false,
    playing: false,
    error: null,
  });
  const volume = useSettingsStore((state) => state.musicVolume);
  const isMuted = useSettingsStore((state) => state.isMusicMuted);

  // Create the single audio element once, on mount, and never again.
  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    const handleCanPlay = () => {
      setDiagnostics((current) => ({ ...current, loaded: true }));
    };
    const handleError = () => {
      const message = audio.error
        ? `code ${audio.error.code.toString()}: ${audio.error.message || "unknown media error"}`
        : "unknown audio error";
      setDiagnostics((current) => ({ ...current, error: message }));
      if (import.meta.env.DEV) {
        console.error(`[GlobalMusicController] Failed to load "${MUSIC_SRC}": ${message}`);
      }
    };
    const handlePlay = () => {
      setDiagnostics((current) => ({ ...current, playing: true }));
    };
    const handlePause = () => {
      setDiagnostics((current) => ({ ...current, playing: false }));
    };

    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Volume/mute apply immediately to the existing element - never
  // recreates it, never restarts playback.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  // First real user interaction triggers play() - required by browser
  // autoplay policy. Listens across the three interaction types
  // requested, and keeps listening until play() actually succeeds -
  // if the first attempt fails for a transient reason (not yet
  // buffered enough, a momentary network hiccup), a later interaction
  // gets another chance rather than the app silently giving up after
  // one failed try.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const attemptPlay = () => {
      if (audio.error) {
        // Already in a known error state (e.g. failed to load) -
        // graceful fallback: skip silently rather than firing another
        // doomed play() call and another console entry for the same
        // underlying problem every time the player clicks or presses
        // a key. The game continues normally without music.
        return;
      }
      audio
        .play()
        .then(() => {
          window.removeEventListener("pointerdown", attemptPlay);
          window.removeEventListener("keydown", attemptPlay);
          window.removeEventListener("touchstart", attemptPlay);
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          setDiagnostics((current) => ({ ...current, error: message }));
          if (import.meta.env.DEV) {
            console.error(`[GlobalMusicController] audio.play() failed: ${message}`);
          }
          // Listeners stay attached - the next interaction gets another try.
        });
    };

    window.addEventListener("pointerdown", attemptPlay);
    window.addEventListener("keydown", attemptPlay);
    window.addEventListener("touchstart", attemptPlay);

    return () => {
      window.removeEventListener("pointerdown", attemptPlay);
      window.removeEventListener("keydown", attemptPlay);
      window.removeEventListener("touchstart", attemptPlay);
    };
  }, []);

  // Pause when the tab is hidden, resume when visible again - not
  // paused merely because the in-app route changes.
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      if (document.hidden) {
        audio.pause();
      } else if (audio.paused && audio.currentTime > 0) {
        // Only auto-resume if playback had actually started before -
        // don't fight the pre-first-interaction autoplay gate.
        audio.play().catch(() => {
          // Same handling as the main play attempt; not re-logged
          // here to avoid duplicate noise for the same underlying
          // autoplay restriction.
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!import.meta.env.DEV) {
    return null;
  }

  // Temporary development diagnostic indicator, as explicitly
  // requested - remove once playback is confirmed working in a real
  // browser, which could not be done from this environment.
  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        color: "#fff",
        fontSize: 11,
        fontFamily: "monospace",
        padding: "6px 8px",
        borderRadius: 4,
        pointerEvents: "none",
      }}
    >
      <div>Music loaded: {String(diagnostics.loaded)}</div>
      <div>Music playing: {String(diagnostics.playing)}</div>
      <div>Music muted: {String(isMuted)}</div>
      <div>Music volume: {volume.toFixed(2)}</div>
      <div>Music error: {diagnostics.error ?? "none"}</div>
    </div>
  );
}
