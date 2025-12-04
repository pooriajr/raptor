import type { Tile } from "../types/board.ts";
import type { PieceState } from "../types/gameState.ts";

// Base class for all game pieces
export abstract class Piece {
  id: string;
  tileId: number;
  localX: number;
  localY: number;

  constructor(id: string, tileId: number, localX: number, localY: number) {
    this.id = id;
    this.tileId = tileId;
    this.localX = localX;
    this.localY = localY;
  }

  // Abstract methods that each piece type must implement
  abstract getEmoji(): string;
  abstract getValidMoves(
    tiles: Tile[],
    pieces: PieceState[],
  ): Array<{ tileId: number; x: number; y: number }>;

  // Common method to check if a move is valid
  isValidMove(
    tiles: Tile[],
    pieces: PieceState[],
    tileId: number,
    x: number,
    y: number,
  ): boolean {
    const validMoves = this.getValidMoves(tiles, pieces);
    return validMoves.some(
      (move) => move.tileId === tileId && move.x === x && move.y === y,
    );
  }

  // Abstract method to create a new instance with updated position
  abstract clone(tileId: number, localX: number, localY: number): Piece;
}
