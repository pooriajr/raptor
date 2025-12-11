import "./Tile.css";
import { motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import type { HighlightStyle } from "./types/highlights.ts";
import type { Space as SpaceType } from "./types/board.ts";
import type { PieceState } from "./types/gameState.ts";
import { getPieceEmoji } from "./utils/pieceUtils.ts";

interface SpaceProps {
  tileId: number;
  space: SpaceType;
  highlight?: { style: HighlightStyle; action?: unknown };
  showCoordinates?: boolean;
  onSpaceClick: (tileId: number, x: number, y: number, spaceId: string) => void;
}

function Space({ tileId, space, highlight, showCoordinates = false, onSpaceClick }: SpaceProps) {
  const { state } = useGame();
  const highlightStyle = highlight?.style;

  // Find piece on this space
  const pieceOnSpace = findPieceOnSpace(state, tileId, space.coordinate.x, space.coordinate.y);

  // Get interaction state for current player
  const currentPlayer = state.activePlayer;
  const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;
  const selectedActorId = interaction.selectedActorId;

  return (
    <div
      className="space"
      data-exit={space.isExit}
      data-mountain={space.hasMountain}
      data-unusable={space.isUnusable}
      data-highlight={highlightStyle}
      onClick={() => onSpaceClick(tileId, space.coordinate.x, space.coordinate.y, space.id)}
    >
      {showCoordinates && (
        <span className="coord">
          {space.coordinate.x},{space.coordinate.y}
        </span>
      )}
      <SpaceContent
        space={space}
        pieceOnSpace={pieceOnSpace}
        highlightStyle={highlightStyle}
        selectedActorId={selectedActorId}
      />
    </div>
  );
}

// Inner component for space content rendering
interface SpaceContentProps {
  space: SpaceType;
  pieceOnSpace: PieceState | null;
  highlightStyle?: HighlightStyle;
  selectedActorId: string | null;
}

function SpaceContent({ space, pieceOnSpace, highlightStyle, selectedActorId }: SpaceContentProps) {
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
    const isSelected = selectedActorId === pieceOnSpace.id;

    return (
      <motion.span
        layout
        layoutId={`piece-${pieceOnSpace.id}`}
        className={`piece piece-${pieceOnSpace.type} ${pieceOnSpace.isAsleep ? "asleep" : ""} ${pieceOnSpace.isFrightened ? "frightened" : ""} ${isSelected ? "action-selected" : ""}`}
        transition={{
          layout: {
            type: "tween",
            duration: 0.2,
            ease: "easeOut",
          },
        }}
      >
        {getPieceEmoji(pieceOnSpace.type)}
        {pieceOnSpace.isAsleep && <span className="status-icon">💤</span>}
        {pieceOnSpace.isFrightened && <span className="status-icon">😨</span>}
      </motion.span>
    );
  }

  // Priority 4: Trail markers (pathTrail highlight)
  if (highlightStyle === "pathTrail") {
    return <span className="path-trail">🐾</span>;
  }

  // Priority 5: Fire token (actual)
  if (highlightStyle === "fire") {
    return <span className="fire-token">🔥</span>;
  }

  return null;
}

// Helper to find piece on a specific space
function findPieceOnSpace(
  state: ReturnType<typeof useGame>["state"],
  tileId: number,
  x: number,
  y: number,
): PieceState | null {
  if (state.mother?.tileId === tileId && state.mother.x === x && state.mother.y === y) {
    return state.mother;
  }
  const baby = state.babies.find((b) => b.tileId === tileId && b.x === x && b.y === y);
  if (baby) return baby;
  const scientist = state.scientists.find((s) => s.tileId === tileId && s.x === x && s.y === y);
  if (scientist) return scientist;
  return null;
}

export default Space;
