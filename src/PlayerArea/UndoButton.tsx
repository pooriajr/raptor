import { useGame } from "../state/GameContext";
import { shouldShowEffectUndo, getEffectPlayer } from "../utils/effectUtils";
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
    dispatch({ type: "REVERT_EFFECT_PHASE" });
  };

  const handleActionReset = () => {
    if (state.actionPhaseSavedState) {
      dispatch({ type: "RESET_ACTION_PHASE", savedState: state.actionPhaseSavedState });
      dispatch({ type: "SELECT_ACTOR", player, pieceId: null });
    }
  };

  if (isThisPlayerEffect && shouldShowEffectUndo(state)) {
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
