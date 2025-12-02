import { Piece } from "./Piece.ts";
import type { Board } from "../types/board.ts";
import {
  localToGlobal,
  globalToLocal,
  getAdjacentGlobalCoordinates,
} from "../types/coordinates.ts";

export class Scientist extends Piece {
  jeepMode: boolean = false;

  getEmoji(): string {
    return this.jeepMode ? "🚙" : "🧑‍🔬";
  }

  toggleJeepMode(): void {
    this.jeepMode = !this.jeepMode;
  }

  getValidMoves(board: Board): Array<{ tileId: number; x: number; y: number }> {
    if (this.jeepMode) {
      return this.getJeepMoves(board);
    } else {
      return this.getNormalMoves(board);
    }
  }

  // Normal mode: move one space orthogonally (like baby raptor)
  private getNormalMoves(
    board: Board,
  ): Array<{ tileId: number; x: number; y: number }> {
    const moves: Array<{ tileId: number; x: number; y: number }> = [];

    const globalPos = localToGlobal(this.tileId, this.localX, this.localY);
    const adjacentPositions = getAdjacentGlobalCoordinates(
      globalPos.globalX,
      globalPos.globalY,
    );

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

  // Jeep mode: move in straight lines like mother raptor
  private getJeepMoves(
    board: Board,
  ): Array<{ tileId: number; x: number; y: number }> {
    const moves: Array<{ tileId: number; x: number; y: number }> = [];

    const globalPos = localToGlobal(this.tileId, this.localX, this.localY);

    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 }, // Down
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 }, // Right
    ];

    for (const dir of directions) {
      let distance = 1;

      while (true) {
        const targetGlobalX = globalPos.globalX + dir.dx * distance;
        const targetGlobalY = globalPos.globalY + dir.dy * distance;

        const localPos = globalToLocal(board, targetGlobalX, targetGlobalY);
        if (!localPos) break;

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

  clone(tileId: number, localX: number, localY: number): Scientist {
    const cloned = new Scientist(this.id, tileId, localX, localY);
    cloned.jeepMode = this.jeepMode; // Preserve jeep mode state
    return cloned;
  }
}
