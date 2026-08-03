import { PuzzleSymbol } from "@/presentation/levels/communication/communicationLevelContent";
import {
  SYMBOL_BOX_GEOMETRY,
  SYMBOL_CONE_GEOMETRY,
  SYMBOL_SPHERE_GEOMETRY,
  TOTEM_BASE_GEOMETRY,
} from "./puzzleGeometry";
import { getSymbolColor } from "./symbolColors";

export interface SymbolShapeProps {
  readonly symbol: PuzzleSymbol;
  readonly color?: string;
}

/** The actual visual for a symbol — one shared component so a totem and a switch always render identically for the same symbol value, which is what makes "do these match" visually legible to the players at all. */
export function SymbolShape({ symbol, color }: SymbolShapeProps) {
  const resolvedColor = color ?? getSymbolColor(symbol);
  if (symbol === PuzzleSymbol.SPHERE) {
    return (
      <mesh geometry={SYMBOL_SPHERE_GEOMETRY} castShadow>
        <meshStandardMaterial
          color={resolvedColor}
          emissive={resolvedColor}
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  }
  if (symbol === PuzzleSymbol.BOX) {
    return (
      <mesh geometry={SYMBOL_BOX_GEOMETRY} castShadow>
        <meshStandardMaterial
          color={resolvedColor}
          emissive={resolvedColor}
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  }
  return (
    <mesh geometry={SYMBOL_CONE_GEOMETRY} castShadow>
      <meshStandardMaterial
        color={resolvedColor}
        emissive={resolvedColor}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

export interface SymbolTotemProps {
  readonly position: readonly [number, number, number];
  readonly symbol: PuzzleSymbol;
}

/** A fixed totem — Player A's side, shows the target symbol, not interactable. */
export function SymbolTotem({ position, symbol }: SymbolTotemProps) {
  return (
    <group position={position}>
      <mesh geometry={TOTEM_BASE_GEOMETRY} position={[0, -0.9, 0]} castShadow>
        <meshStandardMaterial color="#6b5a42" roughness={0.9} />
      </mesh>
      <SymbolShape symbol={symbol} />
    </group>
  );
}
