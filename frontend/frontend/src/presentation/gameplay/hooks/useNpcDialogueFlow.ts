import { useRef, useState } from "react";
import {
  DialogueManager,
  type DialogueSessionSnapshot,
} from "@/domain/gameplay/dialogue/DialogueManager";
import type { DialogueConditionContext } from "@/domain/gameplay/dialogue/DialogueConditionEvaluator";
import { referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

export interface NpcDialogueFlow {
  readonly activeNpcId: string | null;
  readonly snapshot: DialogueSessionSnapshot | null;
  readonly startDialogue: (npcId: string) => void;
  readonly advance: () => void;
  readonly choose: (choiceId: string) => void;
  readonly close: () => void;
}

export function useNpcDialogueFlow(): NpcDialogueFlow {
  const { dialogueTreeRegistry, eventBus, npcManager, questRegistry, scriptureProgressRef } =
    useGameplay();
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DialogueSessionSnapshot | null>(null);
  const managerRef = useRef<DialogueManager | null>(null);

  const buildConditionContext = (): DialogueConditionContext => ({
    getQuestStatus: (questId) =>
      questRegistry.has(questId) ? questRegistry.get(questId).status : null,
    isScriptureUnlocked: (key) =>
      scriptureProgressRef.current
        .listUnlocked()
        .some((unlock) => referenceKey(unlock.reference) === key),
    hasTalkedToNpc: (npcId) => npcManager.getState(npcId).hasBeenTalkedToOnce,
  });

  const startDialogue = (npcId: string) => {
    const definition = npcManager.getDefinition(npcId);
    const manager = new DialogueManager(dialogueTreeRegistry, eventBus, buildConditionContext(), npcId);
    managerRef.current = manager;
    const result = manager.start(definition.dialogueTreeId);
    npcManager.recordInteraction(npcId, result.node.id);
    setActiveNpcId(npcId);
    setSnapshot(result);
  };

  const advance = () => {
    if (!managerRef.current) {
      return;
    }
    setSnapshot(managerRef.current.advancePage());
  };

  const choose = (choiceId: string) => {
    const manager = managerRef.current;
    if (!manager) {
      return;
    }
    const result = manager.chooseChoice(choiceId);
    if (manager.isActive()) {
      setSnapshot(result);
    } else {
      setSnapshot(null);
      setActiveNpcId(null);
      managerRef.current = null;
    }
  };

  const close = () => {
    managerRef.current?.end();
    managerRef.current = null;
    setActiveNpcId(null);
    setSnapshot(null);
  };

  return { activeNpcId, snapshot, startDialogue, advance, choose, close };
}
