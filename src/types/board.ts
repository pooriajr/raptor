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
}

// Helper function to create a Space
// In Ruby you might write: def create_space(x, y, has_rock = false, is_exit = false)
export function createSpace(
  x: number,
  y: number,
  hasRock = false,
  isExit = false,
): Space {
  return {
    coordinate: { x, y }, // Shorthand: same as { x: x, y: y }
    hasRock, // Shorthand: same as hasRock: hasRock
    isExit,
  };
}

// Example usage:
// const space = createSpace(3, 5);              // Normal space at (3,5)
// const rockSpace = createSpace(2, 4, true);    // Space with a rock
// const exitSpace = createSpace(0, 0, false, true); // Exit space

// ===== TILE TYPES =====

// A Tile is a section of the board that contains multiple spaces
// The game has 6 square tiles (9 spaces each) and 4 L-shaped tiles (3 spaces + exit)
export interface Tile {
  id: number; // Unique identifier: 0-9 for the 10 tiles
  shape: "square" | "L"; // The "|" means "or" - must be one of these two strings
  spaces: Space[]; // Array of Space objects in this tile
}

// The Board holds all the tiles
// In Ruby you might use: { tiles: [...] }
export interface Board {
  tiles: Tile[]; // Array of all 10 tiles
}

// ===== TILE GENERATION FUNCTIONS =====

// Create a square tile with 9 spaces in a 3×3 grid
// For now, we'll create simple tiles without rocks (we'll add rock patterns later)
export function createSquareTile(id: number): Tile {
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

// Create an L-shaped tile with 3 spaces + 1 exit
// L-shaped tiles look like:
//   X
//   X
//   X E  (where E is the exit half-space)
export function createLShapedTile(id: number): Tile {
  const spaces: Space[] = [
    createSpace(0, 0), // Top of the L
    createSpace(0, 1), // Middle of the L
    createSpace(0, 2), // Bottom of the L
    createSpace(1, 2, false, true), // Exit half-space (bottom-right)
  ];

  return {
    id,
    shape: "L",
    spaces,
  };
}

// ===== BOARD GENERATION =====

// Create the complete game board with all 10 tiles
// 6 square tiles (form the main 2×3 rectangle)
// 4 L-shaped tiles (attach to the short sides for exits)
export function createBoard(): Board {
  const tiles: Tile[] = [
    // 6 square tiles
    createSquareTile(0),
    createSquareTile(1),
    createSquareTile(2),
    createSquareTile(3),
    createSquareTile(4),
    createSquareTile(5),
    // 4 L-shaped tiles
    createLShapedTile(6),
    createLShapedTile(7),
    createLShapedTile(8),
    createLShapedTile(9),
  ];

  return { tiles };
}
