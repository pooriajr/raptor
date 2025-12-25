import type { Space, Tile } from "@/types/board.ts";

export function getTileById(tiles: Tile[], tileId: number): Tile | undefined {
  return tiles.find((tile) => tile.id === tileId);
}

export function getSpaceOnTile(tile: Tile | undefined, x: number, y: number): Space | undefined {
  if (!tile) return undefined;
  return tile.spaces.find((space) => space.coordinate.x === x && space.coordinate.y === y);
}

export function getSpaceByCoords(tiles: Tile[], tileId: number, x: number, y: number): Space | undefined {
  return getSpaceOnTile(getTileById(tiles, tileId), x, y);
}
