import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHARACTER_MODEL_ASSET_IDS } from "../characterModelAssets";

export type PlayableCharacterId = "boy" | "girl";

export const PLAYABLE_CHARACTERS: Readonly<
  Record<PlayableCharacterId, { readonly label: string; readonly modelAssetId: string }>
> = {
  boy: { label: "Boy", modelAssetId: CHARACTER_MODEL_ASSET_IDS.BOY },
  girl: { label: "Girl", modelAssetId: CHARACTER_MODEL_ASSET_IDS.GIRL },
};

interface CharacterSelectionState {
  readonly selectedCharacterId: PlayableCharacterId | null;
  selectCharacter: (id: PlayableCharacterId) => void;
}

/**
 * Persisted to localStorage so the player's choice survives a reload.
 * This is a real production app running in the browser (not a Claude
 * artifact sandbox), so localStorage is the correct, standard choice
 * here — unlike in-artifact code, which cannot use it.
 */
export const useCharacterSelectionStore = create<CharacterSelectionState>()(
  persist(
    (set) => ({
      selectedCharacterId: null,
      selectCharacter: (id) => {
        set({ selectedCharacterId: id });
      },
    }),
    { name: "the-garden:character-selection" }
  )
);
