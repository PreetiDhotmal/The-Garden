import { create } from "zustand";

export interface VersePopupData {
  readonly referenceText: string;
  readonly verseText: string;
}

export interface RewardPopupData {
  readonly experience: number;
  readonly faithPoints: number;
  readonly coins: number;
}

interface PopupState {
  readonly versePopup: VersePopupData | null;
  readonly rewardPopup: RewardPopupData | null;
  readonly achievementPopup: string | null;
  showVersePopup: (data: VersePopupData) => void;
  showRewardPopup: (data: RewardPopupData) => void;
  showAchievementPopup: (achievementId: string) => void;
  closeVersePopup: () => void;
  closeRewardPopup: () => void;
  closeAchievementPopup: () => void;
}

export const usePopupStore = create<PopupState>((set) => ({
  versePopup: null,
  rewardPopup: null,
  achievementPopup: null,
  showVersePopup: (data) => {
    set({ versePopup: data });
  },
  showRewardPopup: (data) => {
    set({ rewardPopup: data });
  },
  showAchievementPopup: (achievementId) => {
    set({ achievementPopup: achievementId });
  },
  closeVersePopup: () => {
    set({ versePopup: null });
  },
  closeRewardPopup: () => {
    set({ rewardPopup: null });
  },
  closeAchievementPopup: () => {
    set({ achievementPopup: null });
  },
}));
