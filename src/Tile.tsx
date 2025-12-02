import "./Tile.css";
import type { Tile as TileType, Piece } from "./types/board.ts";

function Tile({ tile, pieces }: { tile: TileType; pieces: Piece[] }) {
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
        {tile.spaces.map((space, index) => {
          const pieceOnSpace = pieces.find(
            (p) =>
              p.localX === space.coordinate.x &&
              p.localY === space.coordinate.y,
          );

          return (
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
              {pieceOnSpace && <span className="piece">🔵</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tile;
