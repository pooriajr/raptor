import { useGame } from "./state/GameContext";
import { shouldShowEffectUndo, getCurrentEffectType, getEffectPlayer } from "./utils/effectUtils";
import "./UndoButton.css";

interface UndoButtonProps {
  player: "raptor" | "scientist";
}

function UndoButton({ player }: UndoButtonProps) {
  const { state, dispatch } = useGame();

  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";
  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhase && state.activePlayer === player;

  const hasActionsTaken =
    state.actionPhaseSavedState !== null && state.actionPoints < state.actionPhaseSavedState.actionPoints;

  const handleEffectUndo = () => {
    const effectType = getCurrentEffectType(state);
    if (effectType === "fire") {
      dispatch({ type: "CLEAR_FIRE_PLACEMENTS", player });
    } else if (effectType === "jeep") {
      dispatch({ type: "CLEAR_JEEP_MOVES", player });
      dispatch({ type: "SELECT_SCIENTIST_FOR_JEEP", player, scientistId: null });
    }
  };

  const handleActionReset = () => {
    if (state.actionPhaseSavedState) {
      dispatch({ type: "RESET_ACTION_PHASE", savedState: state.actionPhaseSavedState });
      dispatch({ type: "SELECT_ACTION_PIECE", player, pieceId: null });
    }
  };

  // Determine if button should show and what it should do
  if (isThisPlayerEffect && shouldShowEffectUndo(state, player)) {
    return (
      <button className="undo-button" onClick={handleEffectUndo} title="Undo">
        ↩
      </button>
    );
  }

  if (isThisPlayerAction && hasActionsTaken) {
    return (
      <button className="undo-button" onClick={handleActionReset} title="Reset">
        Reset
      </button>
    );
  }

  return null;
}

export default UndoButton;
