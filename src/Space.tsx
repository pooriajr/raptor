import "./Space.css";
import { useGame } from "./state/GameContext.tsx";
import type { Space as SpaceType } from "./types/board.ts";
import type { GameState, ScientistState, BabyState, MotherState } from "./types/gameState.ts";
import type { SpaceStyle, SpaceActions } from "./types/spaceActions.ts";
import { parseSpaceId } from "./types/spaceActions.ts";
import { buildSpaceActions } from "./utils/buildSpaceActions.ts";
import type { GameAction } from "./state/gameReducer.ts";
import { BabyPiece, MotherPiece } from "./Piece.tsx";
import ScientistPiece from "./ScientistPiece.tsx";

interface SpaceProps {
  space: SpaceType;
}

function Space({ space }: SpaceProps) {
  const { state, dispatch } = useGame();
  const spaceActions: SpaceActions<GameAction> = buildSpaceActions(state);
  const spaceAction = spaceActions.get(space.id);
  const style = spaceAction?.style;

  // Parse space.id to get tileId for piece lookup
  const { tileId } = parseSpaceId(space.id);

  // Find piece on this space
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

  return (
    <div
      className="space"
      data-exit={space.isExit}
      data-mountain={space.hasMountain}
      data-unusable={space.isUnusable}
      data-style={style}
      onClick={handleClick}
    >
      <SpaceContent space={space} pieceOnSpace={pieceOnSpace} style={style} selectedActorId={selectedActorId} />
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
  selectedActorId: string | null;
}

function SpaceContent({ space, pieceOnSpace, style, selectedActorId }: SpaceContentProps) {
  // Priority 1: Mountain
  if (space.hasMountain) {
    return <span className="mountain">⛰️</span>;
  }

  // Priority 2: Exit
  if (space.isExit) {
    return <span className="exit">🚪</span>;
  }

  // Priority 3: Piece
  if (pieceOnSpace) {
    const isSelected = selectedActorId === pieceOnSpace.data.id;
    switch (pieceOnSpace.type) {
      case "scientist":
        return <ScientistPiece scientist={pieceOnSpace.data} isSelected={isSelected} />;
      case "baby":
        return <BabyPiece baby={pieceOnSpace.data} isSelected={isSelected} />;
      case "mother":
        return <MotherPiece mother={pieceOnSpace.data} isSelected={isSelected} />;
    }
  }

  // Priority 4: Fire token
  if (style === "fire") {
    return <span className="fire-token">🔥</span>;
  }

  return null;
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
