import { Piece } from "./Piece.ts";
import type { Board } from "../types/board.ts";
import { localToGlobal, globalToLocal } from "../types/coordinates.ts";

export class MotherRaptor extends Piece {
  getEmoji(): string {
    return "🦖";
  }

  getValidMoves(board: Board): Array<{ tileId: number; x: number; y: number }> {
    const moves: Array<{ tileId: number; x: number; y: number }> = [];

    // Convert current position to global coordinates
    const globalPos = localToGlobal(this.tileId, this.localX, this.localY);

    // Four orthogonal directions (up, down, left, right)
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 }, // Down
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 }, // Right
    ];

    // For each direction, move as far as possible until hitting an obstacle
    for (const dir of directions) {
      let distance = 1;

      while (true) {
        const targetGlobalX = globalPos.globalX + dir.dx * distance;
        const targetGlobalY = globalPos.globalY + dir.dy * distance;

        // Try to convert to local coordinates
        const localPos = globalToLocal(board, targetGlobalX, targetGlobalY);

        // Stop if out of bounds
        if (!localPos) break;

        // Find the target tile and space
        const targetTile = board.tiles.find((t) => t.id === localPos.tileId);
        if (!targetTile) break;

        const targetSpace = targetTile.spaces.find(
          (s) =>
            s.coordinate.x === localPos.localX &&
            s.coordinate.y === localPos.localY,
        );
        if (!targetSpace) break;

        // Stop if mountain
        if (targetSpace.hasMountain) break;

        // Stop if another piece is there
        const isOccupied = board.pieces.some(
          (p) =>
            p.id !== this.id &&
            p.tileId === localPos.tileId &&
            p.localX === localPos.localX &&
            p.localY === localPos.localY,
        );
        if (isOccupied) break;

        // This space is valid
        moves.push({
          tileId: localPos.tileId,
          x: localPos.localX,
          y: localPos.localY,
        });

        distance++;
      }
    }

    return moves;
  }
}
