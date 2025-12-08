import "./Tile.css";
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

interface PendingJeepMove {
  scientistId: string;
  fromTileId: number;
  fromX: number;
  fromY: number;
  toTileId: number;
  toX: number;
  toY: number;
  path: Array<{ tileId: number; x: number; y: number }>;
}

interface FireToken {
  id: string;
  tileId: number;
  x: number;
  y: number;
}

interface TileProps {
  tile: TileType;
  pieces: AdaptedPiece[];
  validMoves: Array<{ tileId: number; x: number; y: number }>;
  setupPlacements?: Array<{ tileId: number; x: number; y: number }>;
  isValidSetupTile?: boolean;
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
  pendingFirePlacements?: Array<{ tileId: number; x: number; y: number }>;
  fireTokens?: FireToken[];
  pendingJeepMoves?: PendingJeepMove[];
  pathTrailPositions?: Array<{ tileId: number; x: number; y: number }>;
  selectedActionPieceId?: string | null;
  hostileTargetIds?: string[];
  friendlyTargetIds?: string[];
  friendlyFirePositions?: Array<{ tileId: number; x: number; y: number }>;
  showCoordinates?: boolean;
  onSpaceClick: (tileId: number, x: number, y: number, pieceId: string | null) => void;
}

function Tile({
  tile,
  pieces,
  validMoves,
  setupPlacements = [],
  isValidSetupTile = false,
  effectTargetIds = [],
  selectedEffectTargets = [],
  effectDestinations = [],
  pendingMoves = [],
  pendingReinforcementPlacements = [],
  pendingFirePlacements = [],
  fireTokens = [],
  pendingJeepMoves = [],
  pathTrailPositions = [],
  selectedActionPieceId = null,
  hostileTargetIds = [],
  friendlyTargetIds = [],
  friendlyFirePositions = [],
  showCoordinates = false,
  onSpaceClick,
}: TileProps) {
  return (
    <div
      className="Tile"
      data-shape={tile.shape}
      data-side={tile.shape === "L" ? tile.side : undefined}
      data-exit-position={tile.shape === "L" ? tile.exitPosition : undefined}
      data-valid-setup-tile={isValidSetupTile}
    >
      {/* Show tile number for debugging */}
      {showCoordinates && <div className="tile-label">Tile {tile.id}</div>}

      {/* Render all spaces in this tile */}
      <div className="spaces-grid">
        {tile.spaces.map((space, index) => {
          const pieceOnSpace = pieces.find((p) => p.localX === space.coordinate.x && p.localY === space.coordinate.y);

          // Check if this space is a valid move
          const isValidMove = validMoves.some((move) => move.x === space.coordinate.x && move.y === space.coordinate.y);

          // Check if this space is a valid setup placement
          const isValidSetupPlacement = setupPlacements.some(
            (s) => s.x === space.coordinate.x && s.y === space.coordinate.y,
          );

          // Check if this space is an effect destination (e.g., Mother's Call)
          const isEffectDestination = effectDestinations.some(
            (dest) => dest.tileId === tile.id && dest.x === space.coordinate.x && dest.y === space.coordinate.y,
          );

          // Check if this space is a pending destination (baby moving here)
          const pendingMoveToHere = pendingMoves.find(
            (m) => m.toTileId === tile.id && m.toX === space.coordinate.x && m.toY === space.coordinate.y,
          );
          const isPendingDestination = !!pendingMoveToHere;

          // Check if this space is where a baby is moving FROM (show footprint)
          const pendingMoveFromHere = pendingMoves.find(
            (m) => m.fromTileId === tile.id && m.fromX === space.coordinate.x && m.fromY === space.coordinate.y,
          );
          const isBabyOrigin = !!pendingMoveFromHere;

          // Check if this space is part of a path trail
          const isPathTrail = pathTrailPositions.some(
            (pos) => pos.tileId === tile.id && pos.x === space.coordinate.x && pos.y === space.coordinate.y,
          );

          // Check if this space has a pending reinforcement placement
          const pendingReinforcement = pendingReinforcementPlacements.find(
            (p) => p.tileId === tile.id && p.x === space.coordinate.x && p.y === space.coordinate.y,
          );
          const isPendingReinforcement = !!pendingReinforcement;

          // Check if this space has an existing fire token
          const hasFireToken = fireTokens.some(
            (f) => f.tileId === tile.id && f.x === space.coordinate.x && f.y === space.coordinate.y,
          );

          // Check if this fire can be extinguished (friendly fire target for mother)
          const isFriendlyFireTarget = friendlyFirePositions.some(
            (f) => f.tileId === tile.id && f.x === space.coordinate.x && f.y === space.coordinate.y,
          );

          // Check if this space has a pending fire placement
          const isPendingFire = pendingFirePlacements.some(
            (p) => p.tileId === tile.id && p.x === space.coordinate.x && p.y === space.coordinate.y,
          );

          // Check if this space is a jeep destination (scientist moving here)
          // Find ALL moves that end at this space
          const jeepMovesToHere = pendingJeepMoves.filter(
            (m) => m.toTileId === tile.id && m.toX === space.coordinate.x && m.toY === space.coordinate.y,
          );

          // Find the move that makes this a FINAL destination (if any)
          // A move is final if no subsequent move starts from this position for that scientist
          const finalJeepMoveHere = jeepMovesToHere.find(
            (m) =>
              !pendingJeepMoves.some(
                (m2) =>
                  m2.scientistId === m.scientistId &&
                  m2.fromTileId === m.toTileId &&
                  m2.fromX === m.toX &&
                  m2.fromY === m.toY,
              ),
          );
          const isFinalJeepDestination = !!finalJeepMoveHere;

          // Intermediate destinations (where a scientist stopped but then moved again)
          // Only show as intermediate if there's NO final destination here
          const isIntermediateJeepStop = jeepMovesToHere.length > 0 && !isFinalJeepDestination;

          // Check if this space is where a scientist is moving FROM via jeep
          const pendingJeepFromHere = pendingJeepMoves.find(
            (m) => m.fromTileId === tile.id && m.fromX === space.coordinate.x && m.fromY === space.coordinate.y,
          );
          const isJeepOrigin = !!pendingJeepFromHere;

          // Check if this space is part of a jeep path (smoke trail)
          const isJeepPath = pendingJeepMoves.some((m) =>
            m.path.some((p) => p.tileId === tile.id && p.x === space.coordinate.x && p.y === space.coordinate.y),
          );

          return (
            <div
              key={index}
              className="space"
              data-exit={space.isExit}
              data-mountain={space.hasMountain}
              data-unusable={space.isUnusable}
              data-valid-move={isValidMove}
              data-valid-setup-placement={isValidSetupPlacement}
              data-effect-destination={isEffectDestination}
              data-pending-destination={isPendingDestination || isPendingReinforcement || isPendingFire}
              data-has-fire={hasFireToken}
              data-path-trail={isPathTrail}
              data-has-effect-target={
                (pieceOnSpace && !isJeepOrigin && effectTargetIds.includes(pieceOnSpace.id)) ||
                (isFinalJeepDestination && finalJeepMoveHere && effectTargetIds.includes(finalJeepMoveHere.scientistId))
              }
              data-hostile-target={pieceOnSpace && hostileTargetIds.includes(pieceOnSpace.id)}
              data-friendly-target={
                (pieceOnSpace && friendlyTargetIds.includes(pieceOnSpace.id)) || isFriendlyFireTarget
              }
              onClick={() => onSpaceClick(tile.id, space.coordinate.x, space.coordinate.y, pieceOnSpace?.id ?? null)}
            >
              {/* Show coordinates for debugging */}
              {showCoordinates && (
                <span className="coord">
                  {space.coordinate.x},{space.coordinate.y}
                </span>
              )}
              {/* Render single space content based on priority */}
              {(() => {
                // Priority 1: Mountain
                if (space.hasMountain) {
                  return <span className="mountain">⛰️</span>;
                }

                // Priority 2: Exit
                if (space.isExit) {
                  return <span className="exit">🚪</span>;
                }

                // Priority 3: Actual piece (not moving away)
                if (pieceOnSpace && !pendingMoveFromHere && !isJeepOrigin) {
                  return (
                    <motion.span
                      layoutId={`piece-${pieceOnSpace.id}`}
                      className={`piece ${pieceOnSpace.isAsleep ? "asleep" : ""} ${pieceOnSpace.isFrightened ? "frightened" : ""} ${effectTargetIds.includes(pieceOnSpace.id) ? "effect-target" : ""} ${selectedEffectTargets.includes(pieceOnSpace.id) ? "effect-selected" : ""} ${selectedActionPieceId === pieceOnSpace.id ? "action-selected" : ""}`}
                      transition={{
                        type: "tween",
                        duration: 0.2,
                        ease: "linear",
                      }}
                    >
                      {pieceOnSpace.getEmoji()}
                      {pieceOnSpace.isAsleep && <span className="status-icon">💤</span>}
                      {pieceOnSpace.isFrightened && <span className="status-icon">😨</span>}
                    </motion.span>
                  );
                }

                // Priority 4: Pending piece previews
                if (isPendingDestination && pendingMoveToHere) {
                  return <span className="piece pending-piece">🦎</span>;
                }

                if (isPendingReinforcement && pendingReinforcement) {
                  return (
                    <motion.span
                      className="piece pending-piece"
                      layoutId={`reinforcement-${pendingReinforcement.id}`}
                      transition={{
                        type: "tween",
                        duration: 0.2,
                        ease: "linear",
                      }}
                    >
                      🧑‍🔬
                    </motion.span>
                  );
                }

                if (isFinalJeepDestination && finalJeepMoveHere) {
                  return <span className="piece pending-piece jeep-car">🚙</span>;
                }

                // Priority 5: Trail markers
                if (isBabyOrigin || isPathTrail) {
                  return <span className="path-trail">🐾</span>;
                }

                if (isJeepOrigin || isIntermediateJeepStop || isJeepPath) {
                  return <span className="jeep-trail">💨</span>;
                }

                // Priority 6: Fire token (actual)
                if (hasFireToken) {
                  return <span className="fire-token">🔥</span>;
                }

                // Priority 7: Pending fire
                if (isPendingFire) {
                  return <span className="fire-token pending-fire">🔥</span>;
                }

                return null;
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tile;
