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
  abstract getValidMoves(): Array<{ tileId: number; x: number; y: number }>;

  // Common method to check if a move is valid
  isValidMove(tileId: number, x: number, y: number): boolean {
    const validMoves = this.getValidMoves();
    return validMoves.some(
      (move) => move.tileId === tileId && move.x === x && move.y === y
    );
  }
}
