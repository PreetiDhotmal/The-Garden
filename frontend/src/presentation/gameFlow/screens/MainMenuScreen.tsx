import { useEffect, useState } from "react";
import { IndexedDbSaveRepository } from "@/infrastructure/gameplay/save/IndexedDbSaveRepository";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { CutsceneGardenBackdrop } from "@/presentation/gameFlow/components/CutsceneGardenBackdrop";
import {
  CinematicFlyoverCamera,
  type FlyoverWaypoint,
} from "@/presentation/gameFlow/components/CinematicFlyoverCamera";
import { usePlayUiSound } from "@/presentation/game/hooks/usePlayUiSound";

export interface MainMenuScreenProps {
  readonly onNewGame: () => void;
  readonly onContinue: () => void;
  readonly onSettings: () => void;
  readonly onCredits: () => void;
}

/** A slow orbit around the center of the Garden, looping continuously — distinct from the cutscene's one-shot point-to-point flyover. */
const MENU_ORBIT_WAYPOINTS: readonly FlyoverWaypoint[] = [
  { position: [30, 14, 0], lookAt: [0, 3, 0] },
  { position: [0, 16, 30], lookAt: [0, 3, 0] },
  { position: [-30, 14, 0], lookAt: [0, 3, 0] },
  { position: [0, 12, -30], lookAt: [0, 3, 0] },
  { position: [30, 14, 0], lookAt: [0, 3, 0] },
];
const MENU_ORBIT_DURATION_SECONDS = 60;

export function MainMenuScreen({
  onNewGame,
  onContinue,
  onSettings,
  onCredits,
}: MainMenuScreenProps) {
  const [hasSave, setHasSave] = useState<boolean | null>(null);
  const playUiSound = usePlayUiSound();

  useEffect(() => {
    const repository = new IndexedDbSaveRepository();
    repository
      .load()
      .then((save) => {
        setHasSave(save !== null);
      })
      .catch(() => {
        setHasSave(false);
      });
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      <div className="absolute inset-0">
        <EngineProvider>
          <GameCanvas>
            <CutsceneGardenBackdrop />
            <CinematicFlyoverCamera
              waypoints={MENU_ORBIT_WAYPOINTS}
              durationSeconds={MENU_ORBIT_DURATION_SECONDS}
              loop
            />
          </GameCanvas>
        </EngineProvider>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-black/35" />

      <div className="relative flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-[var(--font-display)] text-5xl text-light-divine drop-shadow-lg">
            The Garden
          </h1>
          <p className="max-w-md text-center text-sm text-garden-200 drop-shadow">
            A peaceful third-person adventure through seven symbolic worlds of faith.
          </p>
        </div>

        <nav className="flex w-56 flex-col gap-3">
          <MenuButton
            label="New Game"
            onClick={() => {
              playUiSound("audio:ui:button-confirm");
              onNewGame();
            }}
          />
          <MenuButton
            label="Continue"
            onClick={() => {
              playUiSound("audio:ui:button-confirm");
              onContinue();
            }}
            disabled={hasSave !== true}
            {...(hasSave === false ? { title: "No saved game found" } : {})}
          />
          <MenuButton
            label="Settings"
            onClick={() => {
              playUiSound("audio:ui:button-hover");
              onSettings();
            }}
          />
          <MenuButton
            label="Credits"
            onClick={() => {
              playUiSound("audio:ui:button-hover");
              onCredits();
            }}
          />
          <MenuButton
            label="Exit"
            onClick={() => {
              playUiSound("audio:ui:button-hover");
              // See PauseMenu's Quit button — window.close() only
              // succeeds for script-opened windows, a real browser
              // security boundary, not something to fake.
              window.close();
            }}
          />
        </nav>
      </div>
    </div>
  );
}

function MenuButton({
  label,
  onClick,
  disabled,
  title,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-md border border-garden-700 bg-black/40 px-4 py-2 text-light-divine backdrop-blur-sm transition-colors hover:border-garden-500 hover:bg-garden-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-garden-700 disabled:hover:bg-transparent"
    >
      {label}
    </button>
  );
}
