import DevPanel from "./DevPanel.tsx";
import RoundEndTimer from "./RoundEndTimer.tsx";
import BoardView from "./BoardView.tsx";
import { useGame } from "./state/GameContext.tsx";
import { buildSpaceActions } from "./utils/buildSpaceActions.ts";
import { isPhase } from "./state/guards.ts";

function Board() {
  const { state, dispatch } = useGame();
  const spaceActions = buildSpaceActions(state);

  // All phase transition logic is now handled by ADVANCE_PHASE action
  // - Selected card reset: handled in runEntryEffects
  // - Interaction reset: handled in runExitEffects
  // - Action phase state save/clear: handled in runEntryEffects/runExitEffects
  // - Auto-disappearance: handled in runEntryEffects for EFFECT_PHASE
  // - Round end auto-advance: handled by RoundEndTimer component

  return (
    <>
      <DevPanel />
      {isPhase(state, "ROUND_END") && <RoundEndTimer />}
      <BoardView state={state} dispatch={dispatch} spaceActions={spaceActions} />
    </>
  );
}

export default Board;
