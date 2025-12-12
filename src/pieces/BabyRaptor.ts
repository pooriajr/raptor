import { Piece } from "./Piece.ts";
import type { Tile } from "../types/board.ts";
import type { BoardPosition, FireToken } from "../types/gameState.ts";
import { localToGlobal, globalToLocal, getAdjacentGlobalCoordinates } from "../types/coordinates.ts";

export class BabyRaptor extends Piece {
  getEmoji(): string {
    return "🦎";
  }

  getValidMoves(
    tiles: Tile[],
    _pieces: BoardPosition[],
    _fireTokens?: FireToken[],
  ): Array<{ tileId: number; x: number; y: number }> {
    const moves: Array<{ tileId: number; x: number; y: number }> = [];

    // Convert current position to global coordinates
    const globalPos = localToGlobal(this.tileId, this.localX, this.localY);

    // Get adjacent global positions (up, down, left, right)
    const adjacentPositions = getAdjacentGlobalCoordinates(globalPos.globalX, globalPos.globalY);

    // Convert each adjacent position back to local coordinates
    for (const adjPos of adjacentPositions) {
      const localPos = globalToLocal(tiles, adjPos.globalX, adjPos.globalY);
      if (localPos) {
        moves.push({
          tileId: localPos.tileId,
          x: localPos.localX,
          y: localPos.localY,
        });
      }
    }

    return moves;
  }

  clone(tileId: number, localX: number, localY: number): BabyRaptor {
    return new BabyRaptor(this.id, tileId, localX, localY);
  }
}
