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

export function CharacterSelectionScreen({ onConfirm }: CharacterSelectionScreenProps) {
  const selectedCharacterId = useCharacterSelectionStore((state) => state.selectedCharacterId);
  const selectCharacter = useCharacterSelectionStore((state) => state.selectCharacter);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-shadow-valley text-light-divine">
      <h1 className="font-[var(--font-display)] text-4xl">Choose your character</h1>
      <div className="flex gap-6">
        {CHARACTER_ENTRIES.map(([id, character]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              selectCharacter(id);
            }}
            className={`flex h-40 w-32 flex-col items-center justify-end gap-2 rounded-lg border-2 p-4 transition-colors ${
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
