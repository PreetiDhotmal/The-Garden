export interface CreditsScreenProps {
  readonly onBack: () => void;
}

const CREDITS: readonly { role: string; name: string }[] = [
  { role: "Lead Architect & Development", name: "Claude (Anthropic)" },
  { role: "Scripture", name: "YouVersion Platform" },
  { role: "Engine", name: "Three.js, React Three Fiber, Rapier" },
];

export function CreditsScreen({ onBack }: CreditsScreenProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-shadow-valley">
      <h1 className="font-[var(--font-display)] text-3xl text-light-divine">Credits</h1>
      <div className="flex flex-col items-center gap-3">
        {CREDITS.map((credit) => (
          <div key={credit.role} className="text-center">
            <div className="text-xs uppercase tracking-wide text-garden-300">{credit.role}</div>
            <div className="text-light-divine">{credit.name}</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onBack}
        className="rounded-md border border-garden-700 px-4 py-2 text-light-divine hover:border-garden-500"
      >
        Back
      </button>
    </div>
  );
}
