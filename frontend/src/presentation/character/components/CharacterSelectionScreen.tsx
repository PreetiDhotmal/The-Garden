import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { CharacterPreviewScene } from "./CharacterPreviewScene";
import { usePlayUiSound } from "@/presentation/game/hooks/usePlayUiSound";
import {
  PLAYABLE_CHARACTERS,
  useCharacterSelectionStore,
  type PlayableCharacterId,
} from "../stores/characterSelectionStore";

export interface CharacterSelectionScreenProps {
  readonly onConfirm: (characterId: PlayableCharacterId) => void;
}

const CHARACTER_ENTRIES = Object.entries(PLAYABLE_CHARACTERS) as [
  PlayableCharacterId,
  (typeof PLAYABLE_CHARACTERS)[PlayableCharacterId],
][];

const CHARACTER_DESCRIPTIONS: Readonly<Record<PlayableCharacterId, string>> = {
  boy: "Steady and curious — the first to notice what's changed in the Garden.",
  girl: "Warm and observant — the one who remembers where everything used to be.",
};

export function CharacterSelectionScreen({ onConfirm }: CharacterSelectionScreenProps) {
  const selectedCharacterId = useCharacterSelectionStore((state) => state.selectedCharacterId);
  const selectCharacter = useCharacterSelectionStore((state) => state.selectCharacter);
  const playUiSound = usePlayUiSound();
  const previewCharacterId = selectedCharacterId ?? "boy";

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 bg-shadow-valley text-light-divine">
      <h1 className="font-[var(--font-display)] text-4xl">Choose your character</h1>

      <div className="h-72 w-72 overflow-hidden rounded-lg border border-garden-700 bg-black/30">
        <GameCanvas>
          <CharacterPreviewScene
            characterAssetId={PLAYABLE_CHARACTERS[previewCharacterId].modelAssetId}
            characterId={previewCharacterId}
          />
        </GameCanvas>
      </div>
      <p className="max-w-sm text-center text-sm text-garden-300">
        {CHARACTER_DESCRIPTIONS[previewCharacterId]}
      </p>
      <p className="text-xs text-garden-700">Drag to rotate · Scroll to zoom</p>

      <div className="flex gap-6">
        {CHARACTER_ENTRIES.map(([id, character]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              playUiSound("audio:ui:button-hover");
              selectCharacter(id);
            }}
            className={`flex h-16 w-32 flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
              selectedCharacterId === id
                ? "border-garden-500 bg-garden-900"
                : "border-garden-700 bg-black/40 hover:border-garden-500"
            }`}
          >
            <span className="text-lg">{character.label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!selectedCharacterId}
        onClick={() => {
          if (selectedCharacterId) {
            playUiSound("audio:ui:button-confirm");
            onConfirm(selectedCharacterId);
          }
        }}
        className="rounded-md bg-garden-500 px-6 py-2 font-semibold text-garden-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Begin
      </button>
    </div>
  );
}
