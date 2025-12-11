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
  onSpaceClick: (tileId: number, x: number, y: number, pieceId: string | null) => void;
}

function Space({ tileId, space, highlight, showCoordinates = false, onSpaceClick }: SpaceProps) {
  const { state } = useGame();
  const highlightStyle = highlight?.style;

  // Find piece on this space
  const pieceOnSpace = findPieceOnSpace(state, tileId, space.coordinate.x, space.coordinate.y);

  // Get interaction state for current player
  const currentPlayer = state.activePlayer;
  const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;
  const selectedActionPieceId = interaction.selectedActionPieceId;

  // Determine if this piece is an effect target
  const effectTargetIds = getEffectTargetIds(state);
  const isPieceEffectTarget =
    pieceOnSpace && highlightStyle !== "pathTrail" && effectTargetIds.includes(pieceOnSpace.id);

  return (
    <div
      className="space"
      data-exit={space.isExit}
      data-mountain={space.hasMountain}
      data-unusable={space.isUnusable}
      data-highlight={highlightStyle}
      data-has-effect-target={isPieceEffectTarget || undefined}
      onClick={() => onSpaceClick(tileId, space.coordinate.x, space.coordinate.y, pieceOnSpace?.id ?? null)}
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
        effectTargetIds={effectTargetIds}
        selectedActionPieceId={selectedActionPieceId}
      />
    </div>
  );
}

// Inner component for space content rendering
interface SpaceContentProps {
  space: SpaceType;
  pieceOnSpace: PieceState | null;
  highlightStyle?: HighlightStyle;
  effectTargetIds: string[];
  selectedActionPieceId: string | null;
}

function SpaceContent({
  space,
  pieceOnSpace,
  highlightStyle,
  effectTargetIds,
  selectedActionPieceId,
}: SpaceContentProps) {
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
    const isEffectTarget = effectTargetIds.includes(pieceOnSpace.id);
    const isActionSelected = selectedActionPieceId === pieceOnSpace.id;

    return (
      <motion.span
        layout
        layoutId={`piece-${pieceOnSpace.id}`}
        className={`piece piece-${pieceOnSpace.type} ${pieceOnSpace.isAsleep ? "asleep" : ""} ${pieceOnSpace.isFrightened ? "frightened" : ""} ${isEffectTarget ? "effect-target" : ""} ${isActionSelected ? "action-selected" : ""}`}
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

// Helper to get effect target IDs based on current effect type
function getEffectTargetIds(state: ReturnType<typeof useGame>["state"]): string[] {
  if (state.phase !== "EFFECT_PHASE") return [];

  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;
  if (scientistCard === null || raptorCard === null) return [];

  const raptorHasEffect = raptorCard < scientistCard;
  const effectCard = raptorHasEffect ? raptorCard : scientistCard;

  // Determine effect type from card
  if (raptorHasEffect) {
    // Raptor effects
    if (effectCard === 3 || effectCard === 8) {
      // Fear - scientists that aren't frightened
      return state.scientists.filter((s) => !s.isFrightened).map((s) => s.id);
    }
    if (effectCard === 5 || effectCard === 7) {
      // Recovery - sleeping babies
      return state.babies.filter((b) => b.isAsleep).map((b) => b.id);
    }
    if (effectCard === 1 || effectCard === 4) {
      // Mother's Call - babies that can reach mother
      // This is computed elsewhere, return empty for now (handled by highlights)
      return state.babies.map((b) => b.id);
    }
  } else {
    // Scientist effects
    if (effectCard === 1 || effectCard === 4) {
      // Sleeping Gas - awake babies
      return state.babies.filter((b) => !b.isAsleep).map((b) => b.id);
    }
    if (effectCard === 3 || effectCard === 8) {
      // Jeep - scientists
      return state.scientists.filter((s) => !s.isFrightened).map((s) => s.id);
    }
  }

  return [];
}

export default Space;
