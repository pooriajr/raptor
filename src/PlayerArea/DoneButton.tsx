import { useGame } from "../state/GameContext";
import { countPlacedScientists } from "../utils/pieceUtils";
import { getEffectPlayer } from "../utils/effectUtils";
import { isRaptorSetupComplete } from "../utils/boardUtils";
import "./DoneButton.css";

interface DoneButtonProps {
  player: "raptor" | "scientist";
}

function DoneButton({ player }: DoneButtonProps) {
  const { state, dispatch } = useGame();
  const isRaptor = player === "raptor";

  const interaction = isRaptor ? state.raptorInteraction : state.scientistInteraction;
  const selectedCard = interaction.selectedCard;

  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";

  const isThisPlayerSetup =
    (isRaptor && state.phase === "RAPTOR_SETUP") || (!isRaptor && state.phase === "SCIENTIST_SETUP");

  const isThisPlayerSelecting =
    (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhase && state.activePlayer === player;

  // === Handler ===

  const handleClick = () => {
    // Advance the phase - selectedCard stays in interaction state until card reveal
    dispatch({ type: "ADVANCE_PHASE" });
  };

  // === Compute button disabled state ===

  const disabled = (() => {
    if (isThisPlayerSetup) {
      const setupComplete = isRaptor ? isRaptorSetupComplete(state) : countPlacedScientists(state) >= 4;
      return !setupComplete;
    }
    if (isThisPlayerSelecting) {
      return selectedCard === null;
    }
    if (isThisPlayerEffect || isThisPlayerAction) {
      return false;
    }
    // Not this player's turn
    return true;
  })();

  const className = `done-button ${disabled ? "done-button--disabled" : "done-button--ready"}`;

  return (
    <button className={className} disabled={disabled} onClick={handleClick}>
      <span className="done-button__edge" />
      <span className="done-button__front">Done</span>
    </button>
  );
}

export default DoneButton;
