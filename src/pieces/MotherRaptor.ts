import { Piece } from "./Piece.ts";
import type { Tile } from "../types/board.ts";
import type { PieceState, FireToken } from "../types/gameState.ts";
import { localToGlobal, globalToLocal } from "../types/coordinates.ts";

export class MotherRaptor extends Piece {
  getEmoji(): string {
    return "🦖";
  }

  getValidMoves(
    tiles: Tile[],
    pieces: PieceState[],
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
        const targetTile = tiles.find((t) => t.id === localPos.tileId);
        if (!targetTile) break;

        const targetSpace = targetTile.spaces.find(
          (s) => s.coordinate.x === localPos.localX && s.coordinate.y === localPos.localY,
        );
        if (!targetSpace) break;

        // Stop if mountain
        if (targetSpace.hasMountain) break;

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
