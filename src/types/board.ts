export interface Coordinate {
  x: number;
  y: number;
}

export interface Space {
  coordinate: Coordinate;
  hasRock: boolean;
  isExit: boolean;
  isUnusable: boolean;
}

export function createSpace(
  x: number,
  y: number,
  hasRock = false,
  isExit = false,
  isUnusable = false,
): Space {
  return {
    coordinate: { x, y },
    hasRock,
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

export interface Board {
  tiles: Tile[];
}

export function createSquareTile(id: number): SquareTile {
  const spaces: Space[] = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      spaces.push(createSpace(x, y));
    }
  }
  return { id, shape: "square", spaces };
}

export function createLShapedTile(
  id: number,
  side: "left" | "right",
  exitPosition: "top" | "bottom",
): LTile {
  const spaces: Space[] = [];
  const exitCol = side === "left" ? 0 : 1;
  const exitRow = exitPosition === "top" ? 0 : 2;

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 2; x++) {
      const isExitSpace = x === exitCol && y === exitRow;
      const isUnusableSpace = x === exitCol && y !== exitRow;
      spaces.push(createSpace(x, y, false, isExitSpace, isUnusableSpace));
    }
  }

  return { id, shape: "L", side, exitPosition, spaces };
}

export function createBoard(): Board {
  const leftExitAtTop = Math.random() < 0.5;
  const leftBottom = leftExitAtTop ? "bottom" : "top";
  const rightTop = leftExitAtTop ? "bottom" : "top";
  const rightBottom = leftExitAtTop ? "top" : "bottom";

  const tiles: Tile[] = [
    createLShapedTile(0, "left", leftExitAtTop ? "top" : "bottom"),
    createSquareTile(1),
    createSquareTile(2),
    createSquareTile(3),
    createLShapedTile(4, "right", rightTop),
    createLShapedTile(5, "left", leftBottom),
    createSquareTile(6),
    createSquareTile(7),
    createSquareTile(8),
    createLShapedTile(9, "right", rightBottom),
  ];

  return { tiles };
}
