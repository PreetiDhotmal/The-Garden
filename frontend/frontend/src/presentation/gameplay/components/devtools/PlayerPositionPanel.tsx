import { useEffect, useState } from "react";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";

export interface PlayerPositionPanelProps {
  readonly entity: CharacterEntity | null;
}

export function PlayerPositionPanel({ entity }: PlayerPositionPanelProps) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      forceTick((tick) => tick + 1);
    }, 200);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (!entity) {
    return (
      <div className="rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
        Player Position: (not spawned)
      </div>
    );
  }

  const position = entity.getPosition();

  return (
    <div className="rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Player Position</div>
      <div>
        x: {position.x.toFixed(2)} y: {position.y.toFixed(2)} z: {position.z.toFixed(2)}
      </div>
      <div>yaw: {entity.getYaw().toFixed(2)} rad</div>
    </div>
  );
}
