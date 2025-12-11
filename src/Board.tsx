import "./Board.css";
import Tile from "./Tile.tsx";
import { LayoutGroup } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";

function Board() {
  const { state } = useGame();

  // All phase transition logic is now handled by ADVANCE_PHASE action
  // - Selected card reset: handled in runEntryEffects
  // - Interaction reset: handled in runExitEffects
  // - Action phase state save/clear: handled in runEntryEffects/runExitEffects
  // - Auto-disappearance: handled in runEntryEffects for EFFECT_PHASE
  // - Round end: ROUND_END is transient, immediately advances to SCIENTIST_READY

  return (
    <div className="board-container">
      <LayoutGroup>
        <div className="Board">
          {state.tiles.map((tile) => (
            <Tile key={tile.id} tile={tile} />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default Board;
