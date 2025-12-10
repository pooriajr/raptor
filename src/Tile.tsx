import "./Tile.css";
import { motion } from "framer-motion";
import type { Tile as TileType, SpaceHighlights, SpaceId } from "./types/board.ts";

// Adapted piece interface - works with plain data
interface AdaptedPiece {
  id: string;
  type: "mother" | "baby" | "scientist";
  tileId: number;
  localX: number;
  localY: number;
  getEmoji: () => string;
  isAsleep?: boolean;
  isFrightened?: boolean;
}

// Pending preview data - what will appear at a space on confirm
interface PendingPreview {
  type: "baby" | "scientist" | "jeep";
  id?: string | number; // For layoutId animation
}

interface TileProps {
  tile: TileType;
  pieces: AdaptedPiece[];
  highlights: SpaceHighlights;
  isValidSetupTile?: boolean;
  // Piece-level highlighting (by piece ID, not space)
  effectTargetIds?: string[];
  selectedEffectTargets?: string[];
  selectedActionPieceId?: string | null;
  // Pending previews - map of spaceId to what should render there
  pendingPreviews?: Map<SpaceId, PendingPreview>;
  showCoordinates?: boolean;
  onSpaceClick: (tileId: number, x: number, y: number, pieceId: string | null) => void;
}

function Tile({
  tile,
  pieces,
  highlights,
  isValidSetupTile = false,
  effectTargetIds = [],
  selectedEffectTargets = [],
  selectedActionPieceId = null,
  pendingPreviews = new Map(),
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
          const spaceId = space.id;
          const pieceOnSpace = pieces.find((p) => p.localX === space.coordinate.x && p.localY === space.coordinate.y);
          const pendingPreview = pendingPreviews.get(spaceId);
          const spaceHighlight = highlights.get(spaceId);
          const highlightStyle = spaceHighlight?.style;

          // Piece-level effect targeting (not space-based)
          const isPieceEffectTarget =
            pieceOnSpace && highlightStyle !== "pathTrail" && effectTargetIds.includes(pieceOnSpace.id);

          return (
            <div
              key={index}
              className="space"
              data-exit={space.isExit}
              data-mountain={space.hasMountain}
              data-unusable={space.isUnusable}
              data-highlight={highlightStyle}
              data-has-effect-target={isPieceEffectTarget || undefined}
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
                if (pieceOnSpace && highlightStyle !== "pathTrail") {
                  return (
                    <motion.span
                      layout
                      layoutId={`piece-${pieceOnSpace.id}`}
                      className={`piece piece-${pieceOnSpace.type} ${pieceOnSpace.isAsleep ? "asleep" : ""} ${pieceOnSpace.isFrightened ? "frightened" : ""} ${effectTargetIds.includes(pieceOnSpace.id) ? "effect-target" : ""} ${selectedEffectTargets.includes(pieceOnSpace.id) ? "effect-selected" : ""} ${selectedActionPieceId === pieceOnSpace.id ? "action-selected" : ""}`}
                      transition={{
                        layout: {
                          type: "tween",
                          duration: 0.2,
                          ease: "easeOut",
                        },
                      }}
                    >
                      {pieceOnSpace.getEmoji()}
                      {pieceOnSpace.isAsleep && <span className="status-icon">💤</span>}
                      {pieceOnSpace.isFrightened && <span className="status-icon">😨</span>}
                    </motion.span>
                  );
                }

                // Priority 4: Pending piece previews
                if (pendingPreview) {
                  if (pendingPreview.type === "baby") {
                    return <span className="piece pending-piece">🦎</span>;
                  }
                  if (pendingPreview.type === "scientist") {
                    return (
                      <motion.span
                        className="piece pending-piece"
                        layoutId={`reinforcement-${pendingPreview.id}`}
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
                  if (pendingPreview.type === "jeep") {
                    return <span className="piece pending-piece jeep-car">🚙</span>;
                  }
                }

                // Priority 5: Trail markers (pathTrail highlight)
                if (highlightStyle === "pathTrail") {
                  return <span className="path-trail">🐾</span>;
                }

                // Priority 6: Fire token (actual)
                if (highlightStyle === "fire") {
                  return <span className="fire-token">🔥</span>;
                }

                // Priority 7: Pending fire
                if (highlightStyle === "pendingFire") {
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
