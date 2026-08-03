import type { Quest } from "./Quest";
import type { QuestSave } from "./QuestSaveModel";

export interface QuestRepository {
  listAll: () => Promise<readonly Quest[]>;
  getById: (id: string) => Promise<Quest | null>;
  saveProgress: (save: QuestSave) => Promise<void>;
  loadProgress: (questId: string) => Promise<QuestSave | null>;
}
