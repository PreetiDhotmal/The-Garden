import { create } from "zustand";

interface AuthState {
  readonly token: string | null;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => {
    set({ token });
  },
}));
