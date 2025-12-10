import { useGame } from "../state/GameContext";
import { isMotherPlaced, countPlacedBabies, countPlacedScientists } from "../utils/pieceUtils";
import { getEffectPlayer, getCurrentEffectType } from "../utils/effectUtils";
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
    const effectType = getCurrentEffectType(state);

    if (effectType === "fear") {
      dispatch({ type: "FRIGHTEN_SCIENTISTS", pieceIds: interaction.selectedEffectTargets });
      dispatch({ type: "SET_EFFECT_TARGETS", player, pieceIds: [] });
    } else if (effectType === "sleeping_gas") {
      dispatch({ type: "PUT_BABIES_TO_SLEEP", pieceIds: interaction.selectedEffectTargets });
      dispatch({ type: "SET_EFFECT_TARGETS", player, pieceIds: [] });
    } else if (effectType === "recovery") {
      dispatch({ type: "WAKE_BABIES", pieceIds: interaction.selectedEffectTargets });
      dispatch({ type: "SET_EFFECT_TARGETS", player, pieceIds: [] });
    } else if (effectType === "mothers_call") {
      dispatch({ type: "MOTHERS_CALL", moves: interaction.pendingMothersCallMoves });
      dispatch({ type: "CLEAR_MOTHERS_CALL_MOVES", player });
      dispatch({ type: "SELECT_BABY_FOR_CALL", player, babyId: null });
    } else if (effectType === "disappearance") {
      dispatch({ type: "DISAPPEARANCE" });
    } else if (effectType === "reinforcements") {
      dispatch({ type: "REINFORCEMENTS", placements: interaction.pendingReinforcementPlacements });
      dispatch({ type: "CLEAR_REINFORCEMENTS", player });
    } else if (effectType === "fire") {
      dispatch({ type: "PLACE_FIRE", placements: interaction.pendingFirePlacements });
      dispatch({ type: "CLEAR_FIRE_PLACEMENTS", player });
    } else if (effectType === "jeep") {
      dispatch({ type: "JEEP_MOVES", moves: interaction.pendingJeepMoves });
      dispatch({ type: "CLEAR_JEEP_MOVES", player });
      dispatch({ type: "SELECT_SCIENTIST_FOR_JEEP", player, scientistId: null });
    }
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
