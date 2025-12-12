import { createSpaceId, type SpaceId } from "./spaceActions.ts";

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

// Rotate a pattern 90° clockwise: (x, y) -> (2-y, x) for a 3x3 grid
function rotatePattern90(pattern: MountainPattern): MountainPattern {
  return pattern.map(({ x, y }) => ({ x: 2 - y, y: x }));
}

// Rotate a pattern by a random number of 90° turns (0, 1, 2, or 3)
function randomlyRotatePattern(pattern: MountainPattern): MountainPattern {
  const rotations = Math.floor(Math.random() * 4);
  let result = pattern;
  for (let i = 0; i < rotations; i++) {
    result = rotatePattern90(result);
  }
  return result;
}

const MOUNTAIN_PATTERNS: MountainPattern[] = [
  // Pattern A: 1 mountain in the middle
  [{ x: 1, y: 1 }],
  // Pattern B: 1 mountain in a corner
  [{ x: 0, y: 0 }],
  // Pattern C: 1 mountain on center of an edge
  [{ x: 1, y: 0 }],
  // Pattern D: 2 mountains on opposite corners
  [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
  ],
  // Pattern E: 1 mountain on [0,1], 1 on [2,0]
  [
    { x: 0, y: 1 },
    { x: 2, y: 0 },
  ],
  // Pattern F: 1 mountain on [0,1], 1 on [1,1]
  [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
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

  // Shuffle mountain patterns, randomly rotate each, and assign to the 6 square tiles
  const shuffledPatterns = [...MOUNTAIN_PATTERNS]
    .sort(() => Math.random() - 0.5)
    .map((pattern) => randomlyRotatePattern(pattern));

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
