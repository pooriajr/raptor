import { Piece } from "./Piece.ts";
import type { Board } from "../types/board.ts";
import {
  localToGlobal,
  globalToLocal,
  getAdjacentGlobalCoordinates,
} from "../types/coordinates.ts";

export class BabyRaptor extends Piece {
  getEmoji(): string {
    return "🦎";
  }

  getValidMoves(board: Board): Array<{ tileId: number; x: number; y: number }> {
    const moves: Array<{ tileId: number; x: number; y: number }> = [];

    // Convert current position to global coordinates
    const globalPos = localToGlobal(this.tileId, this.localX, this.localY);

    // Get adjacent global positions (up, down, left, right)
    const adjacentPositions = getAdjacentGlobalCoordinates(
      globalPos.globalX,
      globalPos.globalY,
    );

    // Convert each adjacent position back to local coordinates
    for (const adjPos of adjacentPositions) {
      const localPos = globalToLocal(board, adjPos.globalX, adjPos.globalY);
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
