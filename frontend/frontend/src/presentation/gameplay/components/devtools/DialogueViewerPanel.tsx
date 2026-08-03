import type { DialogueSessionSnapshot } from "@/domain/gameplay/dialogue/DialogueManager";

export interface DialogueViewerPanelProps {
  readonly snapshot: DialogueSessionSnapshot | null;
}

export function DialogueViewerPanel({ snapshot }: DialogueViewerPanelProps) {
  return (
    <div className="rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Dialogue Viewer</div>
      {!snapshot ? (
        <div className="text-garden-700">No active dialogue.</div>
      ) : (
        <>
          <div>tree: {snapshot.dialogueTreeId}</div>
          <div>node: {snapshot.node.id}</div>
          <div>
            page: {snapshot.pageIndex + 1}/{snapshot.node.pages.length}
          </div>
          <div>
            choices: {snapshot.availableChoices.map((choice) => choice.id).join(", ") || "(none)"}
          </div>
          <div>
            events on node: {snapshot.node.events.map((event) => event.kind).join(", ") || "(none)"}
          </div>
        </>
      )}
    </div>
  );
}
