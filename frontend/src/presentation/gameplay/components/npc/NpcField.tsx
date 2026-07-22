import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { NpcCharacterView } from "./NpcCharacterView";

export interface NpcFieldProps {
  readonly worldRegionId: string;
  readonly activeNpcId: string | null;
  readonly onInteract: (npcId: string) => void;
}

export function NpcField({ worldRegionId, activeNpcId, onInteract }: NpcFieldProps) {
  const { npcManager } = useGameplay();
  const definitions = npcManager.listByRegion(worldRegionId);

  return (
    <>
      {definitions.map((definition) => (
        <NpcCharacterView
          key={definition.id}
          definition={definition}
          isTalking={activeNpcId === definition.id}
          onInteract={() => {
            onInteract(definition.id);
          }}
        />
      ))}
    </>
  );
}
