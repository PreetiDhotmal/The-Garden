import { usePopupStore } from "../stores/popupStore";

/** Achievement titles keyed by id — a lightweight lookup until a real Achievement domain object exists. */
const ACHIEVEMENT_TITLES: Readonly<Record<string, string>> = {
  "first-scripture-fragment": "First Fragment Found",
};

export function AchievementPopup() {
  const achievementPopup = usePopupStore((state) => state.achievementPopup);
  const closeAchievementPopup = usePopupStore((state) => state.closeAchievementPopup);

  if (!achievementPopup) {
    return null;
  }

  const title = ACHIEVEMENT_TITLES[achievementPopup] ?? achievementPopup;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-72 rounded-lg border-2 border-garden-500 bg-shadow-valley p-6 text-center text-light-divine">
        <p className="text-xs uppercase tracking-widest text-garden-300">Achievement Unlocked</p>
        <p className="mt-2 font-[var(--font-display)] text-xl">{title}</p>
        <button
          type="button"
          onClick={closeAchievementPopup}
          className="mt-5 rounded-md bg-garden-500 px-4 py-1.5 font-semibold text-garden-900"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
