import "./Tile.css";
import { useState } from "react";
import type { Tile as TileType } from "./types/board.ts";
import type { Piece } from "./pieces/Piece.ts";

interface TileProps {
  tile: TileType;
  pieces: Piece[];
  validMoves: Array<{ tileId: number; x: number; y: number }>;
  onMouseDown: (pieceId: string) => void;
  onMouseUp: () => void;
  onDragStart: (pieceId: string) => void;
  onDrop: (tileId: number, localX: number, localY: number) => void;
  onPieceClick: (pieceId: string) => void;
}

function Tile({
  tile,
  pieces,
  validMoves,
  onMouseDown,
  onMouseUp,
  onDragStart,
  onDrop,
  onPieceClick,
}: TileProps) {
  const [dragOverSpace, setDragOverSpace] = useState<string | null>(null);

  const handleDragOver = (
    e: React.DragEvent,
    localX: number,
    localY: number,
    hasMountain: boolean,
    isUnusable: boolean,
    isOccupied: boolean,
  ) => {
    e.preventDefault(); // Allow drop
    // Only highlight if it's a valid drop zone
    if (!hasMountain && !isUnusable && !isOccupied) {
      setDragOverSpace(`${localX},${localY}`);
    } else {
      setDragOverSpace(null);
    }
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

          // Check if this space is a valid move
          const isValidMove = validMoves.some(
            (move) =>
              move.x === space.coordinate.x && move.y === space.coordinate.y,
          );

          return (
            <div
              key={index}
              className="space"
              data-exit={space.isExit}
              data-mountain={space.hasMountain}
              data-unusable={space.isUnusable}
              data-drag-over={isDragOver}
              data-valid-move={isValidMove}
              onDragOver={(e) =>
                handleDragOver(
                  e,
                  space.coordinate.x,
                  space.coordinate.y,
                  space.hasMountain,
                  space.isUnusable,
                  !!pieceOnSpace,
                )
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
                  onMouseDown={() => onMouseDown(pieceOnSpace.id)}
                  onMouseUp={onMouseUp}
                  onDragStart={() => onDragStart(pieceOnSpace.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPieceClick(pieceOnSpace.id);
                  }}
                >
                  {pieceOnSpace.getEmoji()}
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
