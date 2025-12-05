import "./Tile.css";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Tile as TileType } from "./types/board.ts";

// Adapted piece interface - works with plain data
interface AdaptedPiece {
  id: string;
  tileId: number;
  localX: number;
  localY: number;
  getEmoji: () => string;
  isAsleep?: boolean;
  isFrightened?: boolean;
}

interface PendingMove {
  babyId: string;
  fromTileId: number;
  fromX: number;
  fromY: number;
  toTileId: number;
  toX: number;
  toY: number;
}

interface TileProps {
  tile: TileType;
  pieces: AdaptedPiece[];
  validMoves: Array<{ tileId: number; x: number; y: number }>;
  effectTargetIds?: string[];
  selectedEffectTargets?: string[];
  effectDestinations?: Array<{ tileId: number; x: number; y: number }>;
  pendingMoves?: PendingMove[];
  pendingReinforcementPlacements?: Array<{
    id: number;
    tileId: number;
    x: number;
    y: number;
  }>;
  pathTrailPositions?: Array<{ tileId: number; x: number; y: number }>;
  showCoordinates?: boolean;
  onMouseDown: (pieceId: string) => void;
  onMouseUp: () => void;
  onDragStart: (pieceId: string) => void;
  onDrop: (tileId: number, localX: number, localY: number) => void;
  onPieceClick: (pieceId: string) => void;
  onSpaceClick?: (tileId: number, x: number, y: number) => void;
}

function Tile({
  tile,
  pieces,
  validMoves,
  effectTargetIds = [],
  selectedEffectTargets = [],
  effectDestinations = [],
  pendingMoves = [],
  pendingReinforcementPlacements = [],
  pathTrailPositions = [],
  showCoordinates = false,
  onMouseDown,
  onMouseUp,
  onDragStart,
  onDrop,
  onPieceClick,
  onSpaceClick,
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
      {showCoordinates && <div className="tile-label">Tile {tile.id}</div>}

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

          // Check if this space is an effect destination (e.g., Mother's Call)
          const isEffectDestination = effectDestinations.some(
            (dest) =>
              dest.tileId === tile.id &&
              dest.x === space.coordinate.x &&
              dest.y === space.coordinate.y,
          );

          // Check if this space is a pending destination (baby moving here)
          const pendingMoveToHere = pendingMoves.find(
            (m) =>
              m.toTileId === tile.id &&
              m.toX === space.coordinate.x &&
              m.toY === space.coordinate.y,
          );
          const isPendingDestination = !!pendingMoveToHere;

          // Check if this space is where a baby is moving FROM (show footprint)
          const pendingMoveFromHere = pendingMoves.find(
            (m) =>
              m.fromTileId === tile.id &&
              m.fromX === space.coordinate.x &&
              m.fromY === space.coordinate.y,
          );
          const isBabyOrigin = !!pendingMoveFromHere;

          // Check if this space is part of a path trail
          const isPathTrail = pathTrailPositions.some(
            (pos) =>
              pos.tileId === tile.id &&
              pos.x === space.coordinate.x &&
              pos.y === space.coordinate.y,
          );

          // Check if this space has a pending reinforcement placement
          const pendingReinforcement = pendingReinforcementPlacements.find(
            (p) =>
              p.tileId === tile.id &&
              p.x === space.coordinate.x &&
              p.y === space.coordinate.y,
          );
          const isPendingReinforcement = !!pendingReinforcement;

          return (
            <div
              key={index}
              className="space"
              data-exit={space.isExit}
              data-mountain={space.hasMountain}
              data-unusable={space.isUnusable}
              data-drag-over={isDragOver}
              data-valid-move={isValidMove}
              data-effect-destination={isEffectDestination}
              data-pending-destination={
                isPendingDestination || isPendingReinforcement
              }
              data-path-trail={isPathTrail}
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
              onClick={() => {
                if (
                  (isEffectDestination || isPendingReinforcement) &&
                  onSpaceClick
                ) {
                  onSpaceClick(tile.id, space.coordinate.x, space.coordinate.y);
                }
              }}
            >
              {/* Show coordinates for debugging */}
              {showCoordinates && (
                <span className="coord">
                  {space.coordinate.x},{space.coordinate.y}
                </span>
              )}
              {space.hasMountain && <span className="mountain">⛰️</span>}
              {space.isExit && <span className="exit">🚪</span>}
              {/* Show footprint at baby's origin (where baby is moving from) */}
              {isBabyOrigin && <span className="path-trail">🐾</span>}
              {/* Show footprint on path trail (intermediate spaces) */}
              {isPathTrail && !pieceOnSpace && !isBabyOrigin && (
                <span className="path-trail">🐾</span>
              )}
              {/* Show baby at pending destination */}
              {isPendingDestination && pendingMoveToHere && (
                <span
                  className="piece pending-piece"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPieceClick(pendingMoveToHere.babyId);
                  }}
                >
                  🦎
                </span>
              )}
              {/* Show scientist at pending reinforcement placement */}
              {isPendingReinforcement && pendingReinforcement && (
                <motion.span
                  className="piece pending-piece"
                  layoutId={`reinforcement-${pendingReinforcement.id}`}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  🧑‍🔬
                </motion.span>
              )}
              {/* Show piece normally, but hide if it has a pending move */}
              {pieceOnSpace && !pendingMoveFromHere && (
                <span
                  className={`piece ${pieceOnSpace.isAsleep ? "asleep" : ""} ${pieceOnSpace.isFrightened ? "frightened" : ""} ${effectTargetIds.includes(pieceOnSpace.id) ? "effect-target" : ""} ${selectedEffectTargets.includes(pieceOnSpace.id) ? "effect-selected" : ""}`}
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
                  {pieceOnSpace.isAsleep && (
                    <span className="status-icon">💤</span>
                  )}
                  {pieceOnSpace.isFrightened && (
                    <span className="status-icon">😨</span>
                  )}
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
