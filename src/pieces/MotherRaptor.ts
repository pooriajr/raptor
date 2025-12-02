import { Piece } from "./Piece.ts";

export class MotherRaptor extends Piece {
  getEmoji(): string {
    return "🦖";
  }

  getValidMoves(): Array<{ tileId: number; x: number; y: number }> {
    // TODO: Implement mother raptor movement rules
    // For now, return empty array (no movement)
    return [];
  }
}
