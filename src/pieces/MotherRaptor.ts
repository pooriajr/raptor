import { Piece } from "./Piece.ts";
import type { Tile } from "../types/board.ts";
import type { BoardPosition, FireToken } from "../types/gameState.ts";
import { localToGlobal, globalToLocal } from "../types/coordinates.ts";
import { getSpaceOnTile, getTileById } from "../utils/boardQueries.ts";

export class MotherRaptor extends Piece {
  getEmoji(): string {
    return "🦖";
  }

  getValidMoves(
    tiles: Tile[],
    pieces: BoardPosition[],
    fireTokens: FireToken[] = [],
  ): Array<{ tileId: number; x: number; y: number }> {
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
        const localPos = globalToLocal(tiles, targetGlobalX, targetGlobalY);

        // Stop if out of bounds
        if (!localPos) break;

        // Find the target tile and space
        const targetTile = getTileById(tiles, localPos.tileId);
        if (!targetTile) break;

        const targetSpace = getSpaceOnTile(targetTile, localPos.localX, localPos.localY);
        if (!targetSpace) break;

        // Stop if mountain or exit (mother can't enter exits)
        if (targetSpace.hasMountain || targetSpace.isExit) break;

        // Stop if another piece is there
        const isOccupied = pieces.some(
          (p) => p.id !== this.id && p.tileId === localPos.tileId && p.x === localPos.localX && p.y === localPos.localY,
        );
        if (isOccupied) break;

        // Stop if fire is there (mother can't pass through fire)
        const hasFire = fireTokens.some(
          (f) => f.tileId === localPos.tileId && f.x === localPos.localX && f.y === localPos.localY,
        );
        if (hasFire) break;

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

  clone(tileId: number, localX: number, localY: number): MotherRaptor {
    return new MotherRaptor(this.id, tileId, localX, localY);
  }
}
