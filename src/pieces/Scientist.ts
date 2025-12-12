import { Piece } from "./Piece.ts";
import type { Tile } from "../types/board.ts";
import type { BoardPosition, FireToken } from "../types/gameState.ts";
import { localToGlobal, globalToLocal, getAdjacentGlobalCoordinates } from "../types/coordinates.ts";

export class Scientist extends Piece {
  jeepMode: boolean = false;

  getEmoji(): string {
    return this.jeepMode ? "🚙" : "🧑‍🔬";
  }

  toggleJeepMode(): void {
    this.jeepMode = !this.jeepMode;
  }

  getValidMoves(
    tiles: Tile[],
    pieces: BoardPosition[],
    _fireTokens?: FireToken[],
  ): Array<{ tileId: number; x: number; y: number }> {
    if (this.jeepMode) {
      return this.getJeepMoves(tiles, pieces);
    } else {
      return this.getNormalMoves(tiles);
    }
  }

  // Normal mode: move one space orthogonally (like baby raptor)
  private getNormalMoves(tiles: Tile[]): Array<{ tileId: number; x: number; y: number }> {
    const moves: Array<{ tileId: number; x: number; y: number }> = [];

    const globalPos = localToGlobal(this.tileId, this.localX, this.localY);
    const adjacentPositions = getAdjacentGlobalCoordinates(globalPos.globalX, globalPos.globalY);

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

  // Jeep mode: move in straight lines like mother raptor
  private getJeepMoves(tiles: Tile[], pieces: BoardPosition[]): Array<{ tileId: number; x: number; y: number }> {
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

        const localPos = globalToLocal(tiles, targetGlobalX, targetGlobalY);
        if (!localPos) break;

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
