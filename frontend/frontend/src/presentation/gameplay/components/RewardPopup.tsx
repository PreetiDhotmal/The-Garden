import { usePopupStore } from "../stores/popupStore";

export function RewardPopup() {
  const rewardPopup = usePopupStore((state) => state.rewardPopup);
  const closeRewardPopup = usePopupStore((state) => state.closeRewardPopup);

  if (!rewardPopup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-72 rounded-lg border border-garden-700 bg-shadow-valley p-6 text-center text-light-divine">
        <p className="font-[var(--font-display)] text-xl">Reward Received</p>
        <ul className="mt-4 space-y-1 text-sm">
          {rewardPopup.experience > 0 && <li>+{rewardPopup.experience} Experience</li>}
          {rewardPopup.faithPoints > 0 && <li>+{rewardPopup.faithPoints} Faith Points</li>}
          {rewardPopup.coins > 0 && <li>+{rewardPopup.coins} Coins</li>}
        </ul>
        <button
          type="button"
          onClick={closeRewardPopup}
          className="mt-5 rounded-md bg-garden-500 px-4 py-1.5 font-semibold text-garden-900"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
