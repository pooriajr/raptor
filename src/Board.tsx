import "./Board.css";
import Tile from "./Tile.tsx";

import DevPanel from "./DevPanel.tsx";
import RoundEndTimer from "./RoundEndTimer.tsx";
import { useGame } from "./state/GameContext.tsx";

function Board() {
  const { state } = useGame();

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
      <div className="Board">
        {state.tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}

export default Board;
