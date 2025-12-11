import { createSpaceId, type SpaceId } from "./highlights.ts";

export interface Coordinate {
  x: number;
  y: number;
}

export interface Space {
  id: SpaceId;
  coordinate: Coordinate;
  hasMountain: boolean;
  isExit: boolean;
  isUnusable: boolean;
}

export function createSpace(
  tileId: number,
  x: number,
  y: number,
  hasMountain = false,
  isExit = false,
  isUnusable = false,
): Space {
  return {
    id: createSpaceId(tileId, x, y),
    coordinate: { x, y },
    hasMountain,
    isExit,
    isUnusable,
  };
}

interface BaseTile {
  id: number;
  spaces: Space[];
}

export interface SquareTile extends BaseTile {
  shape: "square";
}

export interface LTile extends BaseTile {
  shape: "L";
  side: "left" | "right";
  exitPosition: "top" | "bottom";
}

export type Tile = SquareTile | LTile;

// Mountain patterns for square tiles (3x3 grid, coordinates 0-2)
// Pattern represents which spaces have mountains (x,y coordinates)
type MountainPattern = Array<{ x: number; y: number }>;

const MOUNTAIN_PATTERNS: MountainPattern[] = [
  // Pattern 0: No mountains
  [],
  // Pattern 1: Center mountain (1 mountain)
  [{ x: 1, y: 1 }],
  // Pattern 2: Corner mountain (1 mountain)
  [{ x: 0, y: 0 }],
  // Pattern 3: Two opposite corners (2 mountains)
  [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
  ],
  // Pattern 4: Two adjacent corners (2 mountains)
  [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
  ],
  // Pattern 5: Three corners (3 mountains)
  [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ],
];

export function createSquareTile(id: number, mountainPattern: MountainPattern = []): SquareTile {
  const spaces: Space[] = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const hasMountain = mountainPattern.some((mountain) => mountain.x === x && mountain.y === y);
      spaces.push(createSpace(id, x, y, hasMountain));
    }
  }
  return { id, shape: "square", spaces };
}

export function createLShapedTile(id: number, side: "left" | "right", exitPosition: "top" | "bottom"): LTile {
  const spaces: Space[] = [];
  const exitCol = side === "left" ? 0 : 1;
  const exitRow = exitPosition === "top" ? 0 : 2;

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 2; x++) {
      const isExitSpace = x === exitCol && y === exitRow;
      const isUnusableSpace = x === exitCol && y !== exitRow;
      spaces.push(createSpace(id, x, y, false, isExitSpace, isUnusableSpace));
    }
  }

  return { id, shape: "L", side, exitPosition, spaces };
}

export function createBoard(): Tile[] {
  const leftExitAtTop = Math.random() < 0.5;
  const leftBottom = leftExitAtTop ? "bottom" : "top";
  const rightTop = leftExitAtTop ? "bottom" : "top";
  const rightBottom = leftExitAtTop ? "top" : "bottom";

  // Shuffle mountain patterns and assign to the 6 square tiles
  const shuffledPatterns = [...MOUNTAIN_PATTERNS].sort(() => Math.random() - 0.5);

  return [
    createLShapedTile(0, "left", leftExitAtTop ? "top" : "bottom"),
    createSquareTile(1, shuffledPatterns[0]),
    createSquareTile(2, shuffledPatterns[1]),
    createSquareTile(3, shuffledPatterns[2]),
    createLShapedTile(4, "right", rightTop),
    createLShapedTile(5, "left", leftBottom),
    createSquareTile(6, shuffledPatterns[3]),
    createSquareTile(7, shuffledPatterns[4]),
    createSquareTile(8, shuffledPatterns[5]),
    createLShapedTile(9, "right", rightBottom),
  ];
}
