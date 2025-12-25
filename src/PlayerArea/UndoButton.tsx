import { useGame } from "../state/GameContext";
import { shouldShowEffectUndo, getEffectPlayer } from "../utils/effectUtils";
import { isActionPhaseForPlayer, isPhase } from "../state/guards.ts";

interface UndoButtonProps {
  player: "raptor" | "scientist";
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" style={{ transform: "scaleX(-1)" }}>
      <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

function UndoButton({ player }: UndoButtonProps) {
  const { state, dispatch } = useGame();

  const isEffectPhase = isPhase(state, "EFFECT_PHASE");
  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhaseForPlayer(state, player);

  const showEffectUndo = isThisPlayerEffect && shouldShowEffectUndo(state);
  const showActionReset =
    isThisPlayerAction && state.undoSnapshot !== null && state.actionPoints < state.undoSnapshot.actionPoints;

  const handleUndo = () => {
    if (isEffectPhase) {
      dispatch({ type: "REVERT_EFFECT_PHASE" });
    } else {
      dispatch({ type: "RESET_ACTION_PHASE" });
      dispatch({ type: "SELECT_ACTOR", player, pieceId: null });
    }
  };

  const showButton = showEffectUndo || showActionReset;
  const className = [
    "border-0 bg-transparent p-0 transition-opacity duration-200",
    showButton ? "cursor-pointer opacity-100" : "cursor-default opacity-0",
    player === "raptor" ? "text-[#8bc34a]" : "text-[#e68a11]",
  ].join(" ");

  return (
    <button className={className} onClick={handleUndo} disabled={!showButton} title="Restart">
      <UndoIcon />
    </button>
  );
}

export default UndoButton;
