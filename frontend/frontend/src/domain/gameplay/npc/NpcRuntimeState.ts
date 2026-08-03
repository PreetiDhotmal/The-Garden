export interface NpcRuntimeState {
  readonly npcId: string;
  readonly hasBeenTalkedToOnce: boolean;
  readonly talkCount: number;
  readonly lastDialogueNodeId: string | null;
}

export function createInitialNpcRuntimeState(npcId: string): NpcRuntimeState {
  return { npcId, hasBeenTalkedToOnce: false, talkCount: 0, lastDialogueNodeId: null };
}

export function recordTalkedTo(state: NpcRuntimeState, dialogueNodeId: string): NpcRuntimeState {
  return {
    ...state,
    hasBeenTalkedToOnce: true,
    talkCount: state.talkCount + 1,
    lastDialogueNodeId: dialogueNodeId,
  };
}
