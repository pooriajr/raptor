import "./Board.css";
import Tile from "./Tile.tsx";

import DevPanel from "./DevPanel.tsx";
import RoundEndTimer from "./RoundEndTimer.tsx";
import { useGame } from "./state/GameContext.tsx";
import { buildSpaceActions } from "./utils/buildSpaceActions.ts";
import type { SpaceActions } from "./types/spaceActions.ts";
import type { GameAction } from "./state/gameReducer.ts";

function Board() {
  const { state } = useGame();
  const spaceActions: SpaceActions<GameAction> = buildSpaceActions(state);

  // All phase transition logic is now handled by ADVANCE_PHASE action
  // - Selected card reset: handled in runEntryEffects
  // - Interaction reset: handled in runExitEffects
  // - Action phase state save/clear: handled in runEntryEffects/runExitEffects
  // - Auto-disappearance: handled in runEntryEffects for EFFECT_PHASE
  // - Round end auto-advance: handled by RoundEndTimer component

  return (
    <div className="board-container">
      <DevPanel />
      {state.phase === "ROUND_END" && <RoundEndTimer />}
      {/* SVG clip-path definitions for exit arrow shapes (defined once for all spaces) */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="exit-arrow-right" clipPathUnits="objectBoundingBox">
            <path d="M0.12,0 L0.65,0 L1,0.5 L0.65,1 L0.12,1 Q0,1 0,0.88 L0,0.12 Q0,0 0.12,0" />
          </clipPath>
          <clipPath id="exit-arrow-left" clipPathUnits="objectBoundingBox">
            <path d="M0.88,0 L0.35,0 L0,0.5 L0.35,1 L0.88,1 Q1,1 1,0.88 L1,0.12 Q1,0 0.88,0" />
          </clipPath>
        </defs>
      </svg>
      <div className="Board">
        {state.tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} spaceActions={spaceActions} />
        ))}
      </div>
    </div>
  );
}

export default Board;
