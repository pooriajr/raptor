import "./Tile.css";
import { useState } from "react";
import type { Tile as TileType, Piece } from "./types/board.ts";

interface TileProps {
  tile: TileType;
  pieces: Piece[];
  onDragStart: (pieceId: string) => void;
  onDrop: (tileId: number, localX: number, localY: number) => void;
}

function Tile({ tile, pieces, onDragStart, onDrop }: TileProps) {
  const [dragOverSpace, setDragOverSpace] = useState<string | null>(null);

  const handleDragOver = (
    e: React.DragEvent,
    localX: number,
    localY: number,
  ) => {
    e.preventDefault(); // Allow drop
    setDragOverSpace(`${localX},${localY}`);
  };

  const handleDragLeave = () => {
    setDragOverSpace(null);
  };

  const handleDrop = (e: React.DragEvent, localX: number, localY: number) => {
    e.preventDefault();
    setDragOverSpace(null);
    onDrop(tile.id, localX, localY);
  };

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

          const isDragOver =
            dragOverSpace === `${space.coordinate.x},${space.coordinate.y}`;

          return (
            <div
              key={index}
              className="space"
              data-exit={space.isExit}
              data-mountain={space.hasMountain}
              data-unusable={space.isUnusable}
              data-drag-over={isDragOver}
              onDragOver={(e) =>
                handleDragOver(e, space.coordinate.x, space.coordinate.y)
              }
              onDragLeave={handleDragLeave}
              onDrop={(e) =>
                handleDrop(e, space.coordinate.x, space.coordinate.y)
              }
            >
              {/* Show coordinates for debugging */}
              <span className="coord">
                {space.coordinate.x},{space.coordinate.y}
              </span>
              {space.hasMountain && <span className="mountain">⛰️</span>}
              {space.isExit && <span className="exit">🚪</span>}
              {pieceOnSpace && (
                <span
                  className="piece"
                  draggable
                  onDragStart={() => onDragStart(pieceOnSpace.id)}
                >
                  🔵
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tile;
