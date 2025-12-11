import { useGame } from "../state/GameContext";
import { isMotherPlaced, countPlacedBabies, countPlacedScientists } from "../utils/pieceUtils";
import { getEffectPlayer } from "../utils/effectUtils";
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

  // === Handlers ===

  const handleSetupConfirm = () => {
    if (state.phase === "RAPTOR_SETUP") {
      dispatch({ type: "CONFIRM_RAPTOR_SETUP" });
    } else if (state.phase === "SCIENTIST_SETUP") {
      dispatch({ type: "START_GAME" });
    }
  };

  const handleCardConfirm = () => {
    if (selectedCard === null) return;
    dispatch({ type: "PLAY_CARD", player, card: selectedCard });
    dispatch({ type: "SELECT_CARD", player, card: null });
  };

  const handleEffectConfirm = () => {
    dispatch({ type: "END_EFFECT_PHASE" });
  };

  const handleEndActionPhase = () => {
    dispatch({ type: "END_ACTION_PHASE" });
  };

  // === Compute button state ===

  const { disabled, onClick } = (() => {
    if (isThisPlayerSetup) {
      const setupComplete = isRaptor
        ? isMotherPlaced(state) && countPlacedBabies(state) >= 5
        : countPlacedScientists(state) >= 4;
      return { disabled: !setupComplete, onClick: handleSetupConfirm };
    }
    if (isThisPlayerSelecting) {
      return { disabled: selectedCard === null, onClick: handleCardConfirm };
    }
    if (isThisPlayerEffect) {
      return { disabled: false, onClick: handleEffectConfirm };
    }
    if (isThisPlayerAction) {
      return { disabled: false, onClick: handleEndActionPhase };
    }
    // Not this player's turn
    return { disabled: true, onClick: () => {} };
  })();

  const className = `done-button ${disabled ? "done-button--disabled" : "done-button--ready"}`;

  return (
    <button className={className} disabled={disabled} onClick={onClick}>
      <span className="done-button__edge" />
      <span className="done-button__front">Done</span>
    </button>
  );
}

export default DoneButton;
