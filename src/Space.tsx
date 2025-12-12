import "./Space.css";
import { useGame } from "./state/GameContext.tsx";
import type { Space as SpaceType } from "./types/board.ts";
import type { PieceState, GameState, ScientistState } from "./types/gameState.ts";
import type { SpaceStyle, SpaceActions } from "./types/spaceActions.ts";
import { parseSpaceId } from "./types/spaceActions.ts";
import { buildSpaceActions } from "./utils/buildSpaceActions.ts";
import type { GameAction } from "./state/gameReducer.ts";
import Piece from "./Piece.tsx";
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
  const { piece: pieceOnSpace, scientist: scientistOnSpace } = findPieceOnSpace(
    state,
    tileId,
    space.coordinate.x,
    space.coordinate.y,
  );

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
      <SpaceContent
        space={space}
        pieceOnSpace={pieceOnSpace}
        scientistOnSpace={scientistOnSpace}
        style={style}
        selectedActorId={selectedActorId}
      />
    </div>
  );
}

// Inner component for space content rendering
interface SpaceContentProps {
  space: SpaceType;
  pieceOnSpace: PieceState | null;
  scientistOnSpace: ScientistState | null;
  style?: SpaceStyle;
  selectedActorId: string | null;
}

function SpaceContent({ space, pieceOnSpace, scientistOnSpace, style, selectedActorId }: SpaceContentProps) {
  // Priority 1: Mountain
  if (space.hasMountain) {
    return <span className="mountain">⛰️</span>;
  }

  // Priority 2: Exit
  if (space.isExit) {
    return <span className="exit">🚪</span>;
  }

  // Priority 3: Scientist (uses ScientistPiece component)
  if (scientistOnSpace) {
    const isSelected = selectedActorId === scientistOnSpace.id;
    return <ScientistPiece scientist={scientistOnSpace} isSelected={isSelected} />;
  }

  // Priority 4: Other pieces (mother, baby)
  if (pieceOnSpace) {
    const isSelected = selectedActorId === pieceOnSpace.id;
    return <Piece piece={pieceOnSpace} isSelected={isSelected} />;
  }

  // Priority 5: Fire token
  if (style === "fire") {
    return <span className="fire-token">🔥</span>;
  }

  return null;
}

// Helper to find piece on a specific space
// Returns either a PieceState (mother/baby) or ScientistState, but not both
function findPieceOnSpace(
  state: GameState,
  tileId: number,
  x: number,
  y: number,
): { piece: PieceState | null; scientist: ScientistState | null } {
  if (state.mother?.tileId === tileId && state.mother.x === x && state.mother.y === y) {
    return { piece: state.mother, scientist: null };
  }
  const baby = state.babies.find((b) => b.tileId === tileId && b.x === x && b.y === y);
  if (baby) return { piece: baby, scientist: null };

  const scientist = Object.values(state.scientists).find(
    (s) => s.position?.tileId === tileId && s.position?.x === x && s.position?.y === y,
  );
  return { piece: null, scientist: scientist ?? null };
}

export default Space;
