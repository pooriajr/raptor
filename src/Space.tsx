import { useContext, useState } from "react";
import type { ReactNode } from "react";
import { GameContext, type GameContextValue } from "./state/GameContext.tsx";
import Tooltip from "./Tooltip.tsx";
import type { Space as SpaceType } from "./types/board.ts";
import type { GameState, ScientistState, BabyState, MotherState } from "./types/gameState.ts";
import type { SpaceStyle, SpaceActions } from "./types/spaceActions.ts";
import { parseSpaceId } from "./types/spaceActions.ts";
import type { GameAction } from "./state/gameReducer.ts";
import { BabyPiece } from "./Piece.tsx";
import MotherPiece from "./MotherPiece.tsx";
import ScientistPiece from "./ScientistPiece.tsx";

interface SpaceProps {
  space: SpaceType;
  spaceActions: SpaceActions<GameAction>;
  game?: GameContextValue;
  className?: string;
  overlay?: ReactNode;
}

function Space({ space, spaceActions, game, className, overlay }: SpaceProps) {
  const context = useContext(GameContext);
  const resolvedGame = game ?? context;
  if (!resolvedGame) {
    throw new Error("Space must be used within a GameContext.Provider or passed a game prop");
  }
  const { state, dispatch } = resolvedGame;
  const [showTooltip, setShowTooltip] = useState(false);
  const spaceAction = spaceActions.get(space.id);
  const style = spaceAction?.style;
  const hasAction = Boolean(spaceAction?.action);

  // Parse space.id to get tileId for piece lookup
  const { tileId } = parseSpaceId(space.id);

  // Find piece on this space (excluding mother - she handles her own rendering)
  const pieceOnSpace = findPieceOnSpace(state, tileId, space.coordinate.x, space.coordinate.y);

  // Get interaction state for current player
  const currentPlayer = state.activePlayer;
  const interaction = currentPlayer === "scientist" ? state.scientistInteraction : state.raptorInteraction;
  const selectedActorId = interaction.selectedActorId;

  const handleClick = () => {
    if (spaceAction?.action) {
      dispatch(spaceAction.action);
    }
  };

  const spacePosition = { tileId, x: space.coordinate.x, y: space.coordinate.y };
  const hasFireToken = state.fireTokens.some(
    (fire) => fire.tileId === tileId && fire.x === space.coordinate.x && fire.y === space.coordinate.y,
  );

  // Determine exit direction for triangle shape
  const exitDirection = space.isExit ? (tileId === 0 || tileId === 5 ? "left" : "right") : undefined;

  const fireClassName = hasFireToken && style !== "hostileTarget" ? "bg-[#e8a060] border-[#c07030]" : null;

  const spaceClassName = [
    "relative flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-transparent text-lg",
    "data-[exit=true]:rounded-lg data-[exit=true]:bg-[rgba(200,195,185,0.4)]",
    "data-[exit-direction=right]:[clip-path:url(#exit-arrow-right)] data-[exit-direction=left]:[clip-path:url(#exit-arrow-left)]",
    "data-[mountain=true]:bg-[rgba(50,49,41,0.71)]",
    "data-[unusable=true]:invisible",
    "data-[style=selectable]:cursor-pointer data-[style=selectable]:bg-[rgba(180,220,255,0.85)] data-[style=selectable]:hover:bg-[rgba(150,200,255,0.95)]",
    "data-[style=selected]:cursor-pointer data-[style=selected]:bg-[#ffe066] data-[style=selected]:shadow-[inset_0_0_12px_rgba(255,215,0,0.6)]",
    "data-[style=hostileTarget]:cursor-pointer data-[style=hostileTarget]:bg-[#e89090] data-[style=hostileTarget]:shadow-[inset_0_0_8px_rgba(196,80,80,0.4)]",
    "data-[style=hostileTarget]:hover:bg-[#d87070] data-[style=hostileTarget]:hover:shadow-[inset_0_0_12px_rgba(176,64,64,0.6)]",
    fireClassName,
    "data-[style=disabled]:cursor-not-allowed data-[style=disabled]:bg-[rgba(160,160,160,0.55)]",
    "data-[style=disabled]:shadow-[inset_0_0_10px_rgba(70,70,70,0.25)] data-[style=disabled]:hover:bg-[rgba(160,160,160,0.7)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={spaceClassName}
      data-exit={space.isExit}
      data-exit-direction={exitDirection}
      data-mountain={space.hasMountain}
      data-unusable={space.isUnusable}
      data-fire={hasFireToken}
      data-style={style}
      onClick={handleClick}
      onMouseEnter={() => {
        if (spaceAction?.tooltip) setShowTooltip(true);
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && spaceAction?.tooltip && (
        <Tooltip variant="card" position="above" title="Not allowed" description={spaceAction.tooltip} />
      )}
      <SpaceContent
        space={space}
        pieceOnSpace={pieceOnSpace}
        style={style}
        hasFireToken={hasFireToken}
        selectedActorId={selectedActorId}
        mother={state.mother}
        spacePosition={spacePosition}
      />
      {overlay}
    </div>
  );
}

// Union type for piece on space
type PieceOnSpace =
  | { type: "mother"; data: MotherState }
  | { type: "baby"; data: BabyState }
  | { type: "scientist"; data: ScientistState }
  | null;

// Inner component for space content rendering
interface SpaceContentProps {
  space: SpaceType;
  pieceOnSpace: PieceOnSpace;
  style?: SpaceStyle;
  hasFireToken: boolean;
  selectedActorId: string | null;
  mother: MotherState;
  spacePosition: { tileId: number; x: number; y: number };
}

function SpaceContent({
  space,
  pieceOnSpace,
  style,
  hasFireToken,
  selectedActorId,
  mother,
  spacePosition,
}: SpaceContentProps) {
  // Priority 1: Mountain
  if (space.hasMountain) {
    return <span className="relative z-10 inline-block text-5xl filter-[saturate(0.8)_brightness(0.8)]">⛰️</span>;
  }

  // Priority 2: Exit - empty (shape is via CSS clip-path)
  if (space.isExit) {
    return null;
  }

  // Priority 3: Piece (non-mother)
  if (pieceOnSpace && pieceOnSpace.type !== "mother") {
    const isSelected = selectedActorId === pieceOnSpace.data.id;
    switch (pieceOnSpace.type) {
      case "scientist":
        if (hasFireToken) {
          return (
            <>
              <span className="absolute z-5 text-[42px]">🔥</span>
              <div className="relative z-10">
                <ScientistPiece scientist={pieceOnSpace.data} isSelected={isSelected} />
              </div>
            </>
          );
        }
        return <ScientistPiece scientist={pieceOnSpace.data} isSelected={isSelected} />;
      case "baby":
        return <BabyPiece baby={pieceOnSpace.data} isSelected={isSelected} />;
    }
  }

  // Mother - handles her own AnimatePresence for exit animation
  const isMotherSelected = selectedActorId === mother.id;
  const motherElement = <MotherPiece mother={mother} isSelected={isMotherSelected} spacePosition={spacePosition} />;

  // If mother is here or was here (for exit animation), render her
  if (pieceOnSpace?.type === "mother") {
    return motherElement;
  }

  // Always render MotherPiece - it will return null if not relevant to this space
  // This allows it to handle exit animations when mother disappears
  const motherMaybeHere = motherElement;

  // Priority 4: Fire token
  if (hasFireToken) {
    return <span className="absolute z-5 text-[42px]">🔥</span>;
  }

  // Return mother element (which may be null if she's not here and wasn't here)
  return motherMaybeHere;
}

// Helper to find piece on a specific space
function findPieceOnSpace(state: GameState, tileId: number, x: number, y: number): PieceOnSpace {
  if (state.mother.position?.tileId === tileId && state.mother.position.x === x && state.mother.position.y === y) {
    return { type: "mother", data: state.mother };
  }

  const baby = Object.values(state.babies).find(
    (b) => b.position?.tileId === tileId && b.position?.x === x && b.position?.y === y,
  );
  if (baby) {
    return { type: "baby", data: baby };
  }

  const scientist = Object.values(state.scientists).find(
    (s) => s.position?.tileId === tileId && s.position?.x === x && s.position?.y === y,
  );
  if (scientist) {
    return { type: "scientist", data: scientist };
  }

  return null;
}

export default Space;
