import { buildQuestUIModel } from "@/domain/gameplay/quest/QuestUIModel";
import { QuestStatus } from "@/domain/gameplay/quest/QuestTypes";
import { useGameplay } from "../hooks/useGameplay";
import { useGameplayVersion } from "../hooks/useGameplayVersion";

export function QuestTracker() {
  const { questRegistry } = useGameplay();
  useGameplayVersion();

  const activeQuests = questRegistry.list().filter((quest) => quest.status === QuestStatus.ACTIVE);
  if (activeQuests.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-30 flex w-64 flex-col gap-3">
      {activeQuests.map((quest) => {
        const uiModel = buildQuestUIModel(quest);
        return (
          <div
            key={quest.id}
            className="pointer-events-auto rounded-md border border-garden-700 bg-black/70 p-3 text-light-divine"
          >
            <div className="font-semibold">{uiModel.title}</div>
            {uiModel.currentObjectiveText && (
              <div className="mt-1 text-sm text-garden-300">{uiModel.currentObjectiveText}</div>
            )}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-garden-900">
              <div
                className="h-full bg-garden-500"
                style={{ width: `${(uiModel.progressFraction * 100).toString()}%` }}
              />
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {uiModel.objectiveSummaries.map((objective) => (
                <li
                  key={objective.text}
                  className={objective.isComplete ? "text-garden-500 line-through" : "text-garden-300"}
                >
                  {objective.isOptional ? "(Optional) " : ""}
                  {objective.text}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
