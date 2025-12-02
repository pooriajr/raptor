import "./Tile.css";
import type { Tile as TileType } from "./types/board.ts";

// TypeScript: Define what "props" this component accepts
// In Ruby, this is like defining method parameters: def tile(tile:)
// The { tile }: { tile: TileType } means "expect an object with a tile property"
function Tile({ tile }: { tile: TileType }) {
  return (
    <div
      className="Tile"
      data-shape={tile.shape}
      data-side={tile.shape === "L" ? tile.side : undefined}
      data-exit-position={tile.shape === "L" ? tile.exitPosition : undefined}
    >
      {/* Show tile number for debugging */}
      <div className="tile-label">Tile {tile.id}</div>

      {/* Render all spaces in this tile */}
      <div className="spaces-grid">
        {tile.spaces.map((space, index) => (
          <div
            key={index}
            className="space"
            data-exit={space.isExit}
            data-mountain={space.hasMountain}
            data-unusable={space.isUnusable}
          >
            {/* Show coordinates for debugging */}
            <span className="coord">
              {space.coordinate.x},{space.coordinate.y}
            </span>
            {space.hasMountain && <span className="mountain">⛰️</span>}
            {space.isExit && <span className="exit">🚪</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tile;
