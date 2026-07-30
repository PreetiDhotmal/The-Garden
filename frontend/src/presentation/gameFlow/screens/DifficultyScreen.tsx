import {
  MAX_HEALTH_BY_DIFFICULTY,
  useSettingsStore,
  type Difficulty,
} from "@/presentation/settings/settingsStore";

export interface DifficultyScreenProps {
  readonly onConfirm: () => void;
}

const DIFFICULTIES: readonly { id: Difficulty; label: string; description: string }[] = [
  { id: "easy", label: "Easy", description: "A gentler journey. More resilience along the way." },
  { id: "normal", label: "Normal", description: "The Garden as it was meant to be experienced." },
  { id: "hard", label: "Hard", description: "A test of faith. Less room for error." },
];

export function DifficultyScreen({ onConfirm }: DifficultyScreenProps) {
  const difficulty = useSettingsStore((state) => state.difficulty);
  const setDifficulty = useSettingsStore((state) => state.setDifficulty);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-shadow-valley">
      <h1 className="font-[var(--font-display)] text-3xl text-light-divine">Choose Your Path</h1>

      <div className="flex gap-4">
        {DIFFICULTIES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setDifficulty(option.id);
            }}
            className={`w-48 rounded-lg border p-4 text-left transition-colors ${
              difficulty === option.id
                ? "border-garden-500 bg-garden-900"
                : "border-garden-700 hover:border-garden-500"
            }`}
          >
            <div className="font-[var(--font-display)] text-lg text-light-divine">{option.label}</div>
            <p className="mt-1 text-xs text-garden-300">{option.description}</p>
            <p className="mt-2 font-mono text-[10px] text-garden-700">
              {MAX_HEALTH_BY_DIFFICULTY[option.id]} HP
            </p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="rounded-md border border-garden-700 px-6 py-2 text-light-divine hover:border-garden-500"
      >
        Begin
      </button>
    </div>
  );
}
