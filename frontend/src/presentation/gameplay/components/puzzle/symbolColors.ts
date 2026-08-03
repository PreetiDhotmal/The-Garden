import { PuzzleSymbol } from "@/presentation/levels/communication/communicationLevelContent";

/**
 * One distinct color per symbol, used consistently by both the totem
 * (target) and the switch (player-controlled) for that same symbol -
 * this is what actually makes "do these match" legible at a glance,
 * on top of shape alone.
 */
export function getSymbolColor(symbol: PuzzleSymbol): string {
  if (symbol === PuzzleSymbol.SPHERE) {
    return "#e8c840"; // warm gold
  }
  if (symbol === PuzzleSymbol.BOX) {
    return "#5aa0e0"; // clear blue
  }
  return "#7ae08a"; // fresh green (cone)
}
