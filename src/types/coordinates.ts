import type { Tile } from "./board.ts";

// Global coordinate system for the entire board
// Each tile has a position, and spaces within tiles have local coordinates
// Global coordinates combine both

export interface GlobalCoordinate {
  globalX: number;
  globalY: number;
}

export interface LocalCoordinate {
  tileId: number;
  localX: number;
  localY: number;
}

// Tile layout (from Board.css):
// Row 0: [L-tile 0] [Square 1] [Square 2] [Square 3] [L-tile 4]
// Row 1: [L-tile 5] [Square 6] [Square 7] [Square 8] [L-tile 9]

// Get the global position offset for a tile
export function getTileOffset(tileId: number): {
  offsetX: number;
  offsetY: number;
} {
  const row = tileId < 5 ? 0 : 1;
  const col = tileId % 5;

  // Calculate X offset based on column
  // Column 0 (L-tiles): 0
  // Column 1 (squares): 2 (L-tile width)
  // Column 2 (squares): 5 (L-tile + square)
  // Column 3 (squares): 8 (L-tile + 2 squares)
  // Column 4 (L-tiles): 11 (L-tile + 3 squares)
  let offsetX = 0;
  if (col === 1)
    offsetX = 2; // After left L-tile
  else if (col === 2)
    offsetX = 5; // After left L-tile + 1 square
  else if (col === 3)
    offsetX = 8; // After left L-tile + 2 squares
  else if (col === 4) offsetX = 11; // After left L-tile + 3 squares

  // Calculate Y offset based on row (each tile is 3 spaces tall)
  const offsetY = row * 3;

  return { offsetX, offsetY };
}

// Convert local coordinates to global coordinates
export function localToGlobal(tileId: number, localX: number, localY: number): GlobalCoordinate {
  const { offsetX, offsetY } = getTileOffset(tileId);
  return {
    globalX: offsetX + localX,
    globalY: offsetY + localY,
  };
}

// Convert global coordinates to local coordinates
// Returns null if the global coordinate is not on any tile
export function globalToLocal(tiles: Tile[], globalX: number, globalY: number): LocalCoordinate | null {
  for (const tile of tiles) {
    const { offsetX, offsetY } = getTileOffset(tile.id);

    // Check if global coordinate falls within this tile's bounds
    const tileWidth = tile.shape === "square" ? 3 : 2;
    const tileHeight = 3;

    if (globalX >= offsetX && globalX < offsetX + tileWidth && globalY >= offsetY && globalY < offsetY + tileHeight) {
      const localX = globalX - offsetX;
      const localY = globalY - offsetY;

      // Verify this space actually exists and isn't unusable
      const space = tile.spaces.find((s) => s.coordinate.x === localX && s.coordinate.y === localY && !s.isUnusable);

      if (space) {
        return { tileId: tile.id, localX, localY };
      }
    }
  }

  return null;
}

// Get adjacent global coordinates (up, down, left, right)
export function getAdjacentGlobalCoordinates(globalX: number, globalY: number): GlobalCoordinate[] {
  return [
    { globalX, globalY: globalY - 1 }, // Up
    { globalX, globalY: globalY + 1 }, // Down
    { globalX: globalX - 1, globalY }, // Left
    { globalX: globalX + 1, globalY }, // Right
  ];
}
