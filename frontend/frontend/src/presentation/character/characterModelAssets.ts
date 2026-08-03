export const CHARACTER_MODEL_ASSET_IDS = {
  BOY: "models:characters:boy",
  GIRL: "models:characters:girl",
} as const;

export const CHARACTER_MODEL_URLS: Readonly<Record<string, string>> = {
  [CHARACTER_MODEL_ASSET_IDS.BOY]: "/models/characters/boy.glb",
  [CHARACTER_MODEL_ASSET_IDS.GIRL]: "/models/characters/girl.glb",
};
