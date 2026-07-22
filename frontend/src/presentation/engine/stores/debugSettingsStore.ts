import { create } from "zustand";

interface DebugSettingsState {
  readonly isPanelOpen: boolean;
  readonly isPhysicsDebugEnabled: boolean;
  readonly isAssetBrowserOpen: boolean;
  togglePanel: () => void;
  togglePhysicsDebug: () => void;
  toggleAssetBrowser: () => void;
}

export const useDebugSettingsStore = create<DebugSettingsState>((set) => ({
  isPanelOpen: false,
  isPhysicsDebugEnabled: false,
  isAssetBrowserOpen: false,
  togglePanel: () => {
    set((state) => ({ isPanelOpen: !state.isPanelOpen }));
  },
  togglePhysicsDebug: () => {
    set((state) => ({ isPhysicsDebugEnabled: !state.isPhysicsDebugEnabled }));
  },
  toggleAssetBrowser: () => {
    set((state) => ({ isAssetBrowserOpen: !state.isAssetBrowserOpen }));
  },
}));
