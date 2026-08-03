import { useState } from "react";
import type { InputBinding } from "@/domain/input/InputBinding";
import {
  PLAYER_ONE_KEYBOARD_BINDINGS,
  PLAYER_TWO_KEYBOARD_BINDINGS,
} from "@/domain/input/InputMap";
import {
  PLAYABLE_CHARACTERS,
  type PlayableCharacterId,
} from "@/presentation/character/stores/characterSelectionStore";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { usePlayUiSound } from "@/presentation/game/hooks/usePlayUiSound";
import { useConnectedGamepadCount } from "../hooks/useConnectedGamepadCount";

export interface CoopSetupScreenProps {
  readonly selectedCharacterId: PlayableCharacterId;
  readonly onBothReady: () => void;
}

function otherCharacter(id: PlayableCharacterId): PlayableCharacterId {
  return id === "boy" ? "girl" : "boy";
}

function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatKeyLabel(physicalInput: string): string {
  return physicalInput.replace("Key", "").replace("Arrow", "").replace("Left", " L").replace("Right", " R");
}

export function CoopSetupScreen({ selectedCharacterId, onBothReady }: CoopSetupScreenProps) {
  const { coopSessionManager } = useGameFramework();
  const playUiSound = usePlayUiSound();
  const connectedGamepadCount = useConnectedGamepadCount();
  const [isPlayerOneReady, setIsPlayerOneReady] = useState(false);
  const [isPlayerTwoReady, setIsPlayerTwoReady] = useState(false);

  const playerTwoCharacter = otherCharacter(selectedCharacterId);

  const handlePlayerOneReady = () => {
    if (!coopSessionManager.getMembership("PLAYER_ONE")) {
      coopSessionManager.join("PLAYER_ONE", "player:one", selectedCharacterId);
    }
    setIsPlayerOneReady(true);
    playUiSound("audio:ui:button-confirm");
  };

  const handlePlayerTwoReady = () => {
    if (!coopSessionManager.getMembership("PLAYER_TWO")) {
      coopSessionManager.join("PLAYER_TWO", "player:two", playerTwoCharacter);
    }
    setIsPlayerTwoReady(true);
    playUiSound("audio:ui:button-confirm");
  };

  const bothReady = isPlayerOneReady && isPlayerTwoReady;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-shadow-valley px-8">
      <h1 className="font-[var(--font-display)] text-4xl text-light-divine">Local Co-op Setup</h1>
      <p className="max-w-md text-center text-sm text-garden-300">
        One screen, split in two. Each of you confirms when ready — the Garden waits for both.
      </p>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-6">
        <PlayerSetupCard
          label="Player One"
          characterLabel={PLAYABLE_CHARACTERS[selectedCharacterId].label}
          bindings={PLAYER_ONE_KEYBOARD_BINDINGS}
          isReady={isPlayerOneReady}
          onReady={handlePlayerOneReady}
        />
        <PlayerSetupCard
          label="Player Two"
          characterLabel={PLAYABLE_CHARACTERS[playerTwoCharacter].label}
          bindings={PLAYER_TWO_KEYBOARD_BINDINGS}
          isReady={isPlayerTwoReady}
          onReady={handlePlayerTwoReady}
        />
      </div>

      <div className="w-full max-w-3xl rounded border border-garden-700 bg-black/30 p-3 text-center text-xs text-garden-500">
        Split-screen preview: left half follows Player One, right half follows Player Two.
      </div>
      <div className="text-xs text-garden-700">
        {connectedGamepadCount > 0
          ? `${connectedGamepadCount.toString()} controller${connectedGamepadCount === 1 ? "" : "s"} detected — currently usable by Player One only.`
          : "No controllers detected — keyboard only."}
      </div>

      <button
        type="button"
        disabled={!bothReady}
        onClick={() => {
          playUiSound("audio:ui:screen-transition");
          onBothReady();
        }}
        className="rounded bg-garden-700 px-8 py-3 text-lg text-light-divine transition-opacity hover:bg-garden-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Enter the Garden
      </button>
    </div>
  );
}

function PlayerSetupCard({
  label,
  characterLabel,
  bindings,
  isReady,
  onReady,
}: {
  readonly label: string;
  readonly characterLabel: string;
  readonly bindings: readonly InputBinding[];
  readonly isReady: boolean;
  readonly onReady: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-garden-700 bg-black/20 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg text-light-divine">{label}</h2>
        <span className="text-xs uppercase tracking-wide text-garden-500">{characterLabel}</span>
      </div>
      <div className="flex flex-col gap-1 text-xs text-garden-300">
        {bindings.slice(0, 6).map((binding) => (
          <span key={`${binding.action}-${binding.physicalInput}`}>
            {formatActionLabel(binding.action)}: {formatKeyLabel(binding.physicalInput)}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onReady}
        className={`mt-2 rounded px-4 py-2 text-sm transition-colors ${
          isReady
            ? "bg-garden-500 text-shadow-valley"
            : "border border-garden-700 text-garden-300 hover:text-light-divine"
        }`}
      >
        {isReady ? "Ready ✓" : "Confirm Ready"}
      </button>
    </div>
  );
}
