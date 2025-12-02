import { Piece } from "./Piece.ts";

export class Scientist extends Piece {
  getEmoji(): string {
    return "🔵"; // Generic for now
  }

  getValidMoves(): Array<{ tileId: number; x: number; y: number }> {
    // TODO: Implement scientist movement rules
    // For now, return empty array (no movement)
    return [];
  }
}
