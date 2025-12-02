import { Piece } from "./Piece.ts";

export class BabyRaptor extends Piece {
  getEmoji(): string {
    return "🦎";
  }

  getValidMoves(): Array<{ tileId: number; x: number; y: number }> {
    const moves: Array<{ tileId: number; x: number; y: number }> = [];

    // Baby raptors can move one space orthogonally (up, down, left, right)
    // For now, only within the same tile
    moves.push(
      { tileId: this.tileId, x: this.localX, y: this.localY - 1 }, // Up
      { tileId: this.tileId, x: this.localX, y: this.localY + 1 }, // Down
      { tileId: this.tileId, x: this.localX - 1, y: this.localY }, // Left
      { tileId: this.tileId, x: this.localX + 1, y: this.localY }, // Right
    );

    return moves;
  }
}
