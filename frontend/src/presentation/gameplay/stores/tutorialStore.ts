import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TutorialState {
  readonly hasCompletedTutorial: boolean;
  markCompleted: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      hasCompletedTutorial: false,
      markCompleted: () => {
        set({ hasCompletedTutorial: true });
      },
    }),
    { name: "the-garden:tutorial" }
  )
);
