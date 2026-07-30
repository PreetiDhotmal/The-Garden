import { useEffect, useState } from "react";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { SymbolShape } from "./SymbolTotem";
import { SWITCH_BASE_GEOMETRY } from "./puzzleGeometry";
import {
  ALL_SYMBOLS,
  PuzzleSymbol,
} from "@/presentation/levels/communication/communicationLevelContent";

export interface SwitchPostProps {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly onChanged: (symbol: PuzzleSymbol) => void;
  /** Increments on every recordMissedAttempt() — the switch visibly returns to its starting symbol rather than wherever the player last left it. */
  readonly resetSignal: number;
}

export function SwitchPost({ id, position, onChanged, resetSignal }: SwitchPostProps) {
  const [symbolIndex, setSymbolIndex] = useState(0);

  useEffect(() => {
    setSymbolIndex(0);
  }, [resetSignal]);

  const currentSymbol = ALL_SYMBOLS[symbolIndex] ?? PuzzleSymbol.SPHERE;

  return (
    <group position={position}>
      <mesh geometry={SWITCH_BASE_GEOMETRY} position={[0, -0.9, 0]} castShadow>
        <meshStandardMaterial color="#4a5a6b" roughness={0.85} />
      </mesh>
      <SymbolShape symbol={currentSymbol} color="#8fb0e0" />
      <InteractableObject
        id={id}
        position={[0, 0, 0]}
        promptText="Cycle Switch"
        radius={2}
        color="#8fb0e0"
        onInteract={() => {
          const nextIndex = (symbolIndex + 1) % ALL_SYMBOLS.length;
          setSymbolIndex(nextIndex);
          const nextSymbol = ALL_SYMBOLS[nextIndex] ?? PuzzleSymbol.SPHERE;
          onChanged(nextSymbol);
        }}
      />
    </group>
  );
}
