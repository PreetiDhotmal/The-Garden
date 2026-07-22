import { usePopupStore } from "../stores/popupStore";

export function VersePopup() {
  const versePopup = usePopupStore((state) => state.versePopup);
  const closeVersePopup = usePopupStore((state) => state.closeVersePopup);

  if (!versePopup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-w-md rounded-lg border border-garden-700 bg-shadow-valley p-6 text-center text-light-divine">
        <p className="font-[var(--font-display)] text-xl italic">
          &ldquo;{versePopup.verseText}&rdquo;
        </p>
        <p className="mt-3 text-garden-300">{versePopup.referenceText}</p>
        <button
          type="button"
          onClick={closeVersePopup}
          className="mt-5 rounded-md bg-garden-500 px-4 py-1.5 font-semibold text-garden-900"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
