// This file defines the shape of our board data
// Think of these like Ruby class definitions, but just for data structure

// A coordinate is just an x,y position on the board
// In Ruby you might use a hash: { x: 3, y: 5 }
// In TypeScript we define the "shape" first with an interface
export interface Coordinate {
  x: number; // number is like Ruby's Integer or Float
  y: number;
}

// A Space is one spot on the board
// In the Raptor game, spaces can have rocks or be exits
export interface Space {
  coordinate: Coordinate; // Where this space is on the board
  hasRock: boolean; // boolean is like Ruby's true/false
  isExit: boolean; // true if this is a half-space exit for baby raptors
  isUnusable: boolean; // true if this is an empty grid cell (for L-tile layout)
}

// Helper function to create a Space
// In Ruby you might write: def create_space(x, y, has_rock = false, is_exit = false)
export function createSpace(
  x: number,
  y: number,
  hasRock = false,
  isExit = false,
  isUnusable = false,
): Space {
  return {
    coordinate: { x, y }, // Shorthand: same as { x: x, y: y }
    hasRock, // Shorthand: same as hasRock: hasRock
    isExit,
    isUnusable,
  };
}

// Example usage:
// const space = createSpace(3, 5);              // Normal space at (3,5)
// const rockSpace = createSpace(2, 4, true);    // Space with a rock
// const exitSpace = createSpace(0, 0, false, true); // Exit space

// ===== TILE TYPES =====

// Base properties shared by all tiles
interface BaseTile {
  id: number; // Unique identifier: 0-9 for the 10 tiles
  spaces: Space[]; // Array of Space objects in this tile
}

// Square tiles form the main 2×3 rectangle in the center
export interface SquareTile extends BaseTile {
  shape: "square";
}

// L-shaped tiles attach to the left and right sides
// IMPORTANT: The long side of the L must always touch the square tiles
// - Left side L-tiles open toward the right (└ or ┌ shapes)
// - Right side L-tiles open toward the left (┘ or ┐ shapes)
// - Exit position determines if exit is at top or bottom of that L-tile
export interface LTile extends BaseTile {
  shape: "L";
  side: "left" | "right"; // Which side of the board (determines horizontal mirror)
  exitPosition: "top" | "bottom"; // Where the exit is on this L-tile
}

// A Tile can be either a SquareTile or an LTile
// In Ruby this is like: Tile = SquareTile | LTile (union type)
export type Tile = SquareTile | LTile;

// The Board holds all the tiles
// In Ruby you might use: { tiles: [...] }
export interface Board {
  tiles: Tile[]; // Array of all 10 tiles
}

// ===== TILE GENERATION FUNCTIONS =====

// Create a square tile with 9 spaces in a 3×3 grid
// For now, we'll create simple tiles without rocks (we'll add rock patterns later)
export function createSquareTile(id: number): SquareTile {
  const spaces: Space[] = [];

  // Loop through a 3×3 grid
  // In Ruby: (0..2).each do |y| ... end
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      // Create a space at each position
      spaces.push(createSpace(x, y));
    }
  }

  return {
    id,
    shape: "square",
    spaces,
  };
}

// Create an L-shaped tile as a 3×2 grid
// Each L-tile has:
// - One column with 3 regular spaces (the vertical part of the L)
// - One column with 1 exit + 2 unusable spaces
// The exit position determines which row has the exit vs unusable spaces
export function createLShapedTile(
  id: number,
  side: "left" | "right",
  exitPosition: "top" | "bottom",
): LTile {
  const spaces: Space[] = [];

  // All L-tiles are 3 rows × 2 columns
  // Loop through each position in the 3×2 grid
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 2; x++) {
      if (side === "left") {
        // Left side: column 1 has the vertical L (touching square tiles),
        // column 0 has exit + unusable (pointing away from board)
        if (x === 1) {
          // Column 1: all three spaces are usable (the vertical part)
          spaces.push(createSpace(x, y));
        } else {
          // Column 0: exit at specified position, rest unusable
          if (exitPosition === "top" && y === 0) {
            spaces.push(createSpace(x, y, false, true)); // Exit at top
          } else if (exitPosition === "bottom" && y === 2) {
            spaces.push(createSpace(x, y, false, true)); // Exit at bottom
          } else {
            spaces.push(createSpace(x, y, false, false, true)); // Unusable space
          }
        }
      } else {
        // Right side: column 0 has the vertical L (touching square tiles),
        // column 1 has exit + unusable (pointing away from board)
        if (x === 0) {
          // Column 0: all three spaces are usable (the vertical part)
          spaces.push(createSpace(x, y));
        } else {
          // Column 1: exit at specified position, rest unusable
          if (exitPosition === "top" && y === 0) {
            spaces.push(createSpace(x, y, false, true)); // Exit at top
          } else if (exitPosition === "bottom" && y === 2) {
            spaces.push(createSpace(x, y, false, true)); // Exit at bottom
          } else {
            spaces.push(createSpace(x, y, false, false, true)); // Unusable space
          }
        }
      }
    }
  }

  // Debug: log the tile configuration
  console.log(`L-Tile ${id}: side=${side}, exitPosition=${exitPosition}`);
  spaces.forEach((s, i) => {
    console.log(
      `  Space ${i}: (${s.coordinate.x},${s.coordinate.y}) exit=${s.isExit} unusable=${s.isUnusable}`,
    );
  });

  return {
    id,
    shape: "L",
    side,
    exitPosition,
    spaces,
  };
}

// ===== BOARD GENERATION =====

// Create the complete game board with all 10 tiles
// 6 square tiles (form the main 2×3 rectangle)
// 4 L-shaped tiles (attach to the left and right sides for exits)
//
// L-tile configuration:
// - One side has exits "spread" (C-shape): one at top, one at bottom
// - Other side has exits "clustered": both in the middle rows
// - Randomly choose which side gets which configuration
export function createBoard(): Board {
  // Two possible configurations:
  // Case 1 (spread): Tile 0 exit at top (0,0), Tile 5 exit at bottom (0,2)
  // Case 2 (clustered): Tile 0 exit at bottom (0,2), Tile 5 exit at top (0,0)
  // Right side is always opposite of left side
  const tile0ExitAtTop = Math.random() < 0.5;

  // Create the L-tiles with IDs matching their visual position (0-9)
  const leftTopTile = createLShapedTile(
    0,
    "left",
    tile0ExitAtTop ? "top" : "bottom",
  );
  const leftBottomTile = createLShapedTile(
    5,
    "left",
    tile0ExitAtTop ? "bottom" : "top", // Opposite of tile 0
  );
  const rightTopTile = createLShapedTile(
    4,
    "right",
    tile0ExitAtTop ? "bottom" : "top", // Opposite of tile 0
  );
  const rightBottomTile = createLShapedTile(
    9,
    "right",
    tile0ExitAtTop ? "top" : "bottom", // Opposite of tile 5
  );

  // Return tiles in visual order: left-to-right, top-to-bottom
  // Row 1: leftTop(0), square(1), square(2), square(3), rightTop(4)
  // Row 2: leftBottom(5), square(6), square(7), square(8), rightBottom(9)
  const tiles: Tile[] = [
    leftTopTile, // ID 0: left side, top
    createSquareTile(1), // ID 1
    createSquareTile(2), // ID 2
    createSquareTile(3), // ID 3
    rightTopTile, // ID 4: right side, top
    leftBottomTile, // ID 5: left side, bottom
    createSquareTile(6), // ID 6
    createSquareTile(7), // ID 7
    createSquareTile(8), // ID 8
    rightBottomTile, // ID 9: right side, bottom
  ];

  return { tiles };
}
