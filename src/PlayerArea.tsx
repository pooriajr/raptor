import CardDeck from "./CardDeck";
import Hand from "./Hand";
import DiscardPile from "./DiscardPile";
import DoneButton from "./DoneButton";
import UndoButton from "./UndoButton";
import Tracker from "./Tracker";
import { useGame } from "./state/GameContext";
import { isMotherPlaced, countPlacedBabies, countPlacedScientists } from "./utils/pieceUtils";
import {
  getEffectPlayer,
  getEffectInstruction,
  isEffectConfirmEnabled,
  getCurrentEffectType,
} from "./utils/effectUtils";
import { hasSavedGame, loadGame } from "./utils/saveLoad";
import "./PlayerArea.css";

interface PlayerAreaProps {
  player: "raptor" | "scientist";
}

function PlayerArea({ player }: PlayerAreaProps) {
  const { state, dispatch } = useGame();
  const isRaptor = player === "raptor";

  // Get interaction state from context
  const interaction = isRaptor ? state.raptorInteraction : state.scientistInteraction;
  const selectedCard = interaction.selectedCard;
  const isNewDraw = interaction.isNewDraw;

  // Compute floatingCard - shown when opponent is selecting and we've already played
  const floatingCard =
    player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION" ? state.scientistCards.played : null;

  // Card selection handler
  const handleCardSelect = (value: number) => {
    const isThisPlayerSelecting =
      (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
      (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

    if (!isThisPlayerSelecting) return;

    const newCard = selectedCard === value ? null : value;
    dispatch({ type: "SELECT_CARD", player, card: newCard });
  };

  // Derive state from context
  const cards = isRaptor ? state.raptorCards : state.scientistCards;
  const deckCount = cards.deck.length;
  const handCards = cards.hand;
  const playedCard = cards.played;

  const escapedBabies = state.escapedBabies;
  const capturedBabies = state.capturedBabies;
  const motherSleepTokens = state.motherSleepTokens;

  // Compute display modes based on phase
  const isSetupPhase = state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP";
  const isReadyPhase = state.phase === "SCIENTIST_READY" || state.phase === "RAPTOR_READY";

  const isThisPlayerSelecting =
    (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

  const isOpponentSelecting =
    (player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "SCIENTIST_CARD_SELECTION");

  const isCardReveal = state.phase === "CARD_REVEAL";
  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";

  // Determine hand visibility and display mode
  const showHand = !isSetupPhase && !isReadyPhase;
  const handFaceDown = isOpponentSelecting;
  const faceDownUnselectedCards = isEffectPhase || isActionPhase || isCardReveal;

  // === Action handlers ===

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

  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  const handleEndActionPhase = () => {
    dispatch({ type: "END_ACTION_PHASE" });
  };

  // === Compute action info ===

  const getActionInstruction = (): string => {
    if (state.actionPoints === 0) {
      return "No action points remaining";
    }
    return isRaptor ? "Select a piece, then click to move or act" : "Select a scientist, then click to move or act";
  };

  const isThisPlayerSetup =
    (isRaptor && state.phase === "RAPTOR_SETUP") || (!isRaptor && state.phase === "SCIENTIST_SETUP");
  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhase && state.activePlayer === player;

  const actionInfo = (() => {
    if (isRaptor && state.phase === "RAPTOR_SETUP") {
      return {
        phaseLabel: "Raptor Setup",
        progress: (
          <>
            <span>🦖 {isMotherPlaced(state) ? "1" : "0"}/1</span>
            <span>🦎 {countPlacedBabies(state)}/5</span>
          </>
        ),
        instruction: !isMotherPlaced(state)
          ? "Place mother on center tile"
          : countPlacedBabies(state) < 5
            ? "Place babies on square tiles"
            : "Setup complete!",
      };
    }
    if (!isRaptor && state.phase === "SCIENTIST_SETUP") {
      return {
        phaseLabel: "Scientist Setup",
        progress: <span>🧑‍🔬 {countPlacedScientists(state)}/4</span>,
        instruction: countPlacedScientists(state) < 4 ? "Place scientists on L-tiles" : "Setup complete!",
      };
    }
    if (isThisPlayerSelecting) {
      return {
        phaseLabel: "Pick a Card",
        instruction: selectedCard ? `Card ${selectedCard} selected` : "Select a card from your hand",
      };
    }
    if (isThisPlayerEffect) {
      return {
        phaseLabel: "Effect Phase",
        instruction: getEffectInstruction(state, player),
      };
    }
    if (isThisPlayerAction) {
      return {
        phaseLabel: "Action Phase",
        instruction: getActionInstruction(),
        actionPoints: state.actionPoints,
      };
    }
    return null;
  })();

  // === Compute button state ===

  const showLoadButton = isRaptor && state.phase === "RAPTOR_SETUP" && hasSavedGame();

  const actionButton = (() => {
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
      return { disabled: !isEffectConfirmEnabled(state, player), onClick: handleEffectConfirm };
    }
    if (isThisPlayerAction) {
      return { disabled: false, onClick: handleEndActionPhase };
    }
    // Not this player's turn - show done checkmark
    return { disabled: true, onClick: () => {}, isDone: true };
  })();

  return (
    <div className={`player-area ${player}-area`}>
      <div className="player-area-left">
        <div className="deck-section">
          <CardDeck player={player} cardCount={deckCount} />
        </div>
        <div className="discard-section">
          <DiscardPile player={player} />
        </div>

        {isRaptor ? (
          <>
            <Tracker label="Escaped" emoji="🦎" current={escapedBabies ?? 0} max={3} />
            <Tracker label="Mother Sleep Tokens" emoji="💉" current={motherSleepTokens ?? 0} max={5} />
          </>
        ) : (
          <Tracker label="Captured" emoji="🦎" current={capturedBabies ?? 0} max={3} />
        )}
      </div>

      <div className="player-area-center">
        <Hand
          cards={handCards}
          player={player}
          faceDown={handFaceDown}
          playedCard={isThisPlayerSelecting ? null : playedCard}
          selectedCard={isThisPlayerSelecting ? selectedCard : null}
          floatingCard={floatingCard}
          onCardSelect={showHand && !handFaceDown ? handleCardSelect : undefined}
          isNewDraw={isNewDraw}
          deckPosition={{ x: -300, y: 0 }}
          faceDownUnselected={faceDownUnselectedCards}
          showPlaceholders={!showHand}
        />
      </div>

      <div className="player-area-action">
        {actionInfo && (
          <div className="action-info">
            {actionInfo.actionPoints !== undefined && (
              <div className="action-points-display">
                <span className="action-points-value">{actionInfo.actionPoints}</span>
                <span className="action-points-label">AP</span>
              </div>
            )}
            <div className="action-text">
              <div className="action-phase-label">{actionInfo.phaseLabel}</div>
              {actionInfo.progress && <div className="action-progress">{actionInfo.progress}</div>}
              <div className="action-instruction">{actionInfo.instruction}</div>
              <UndoButton player={player} />
            </div>
          </div>
        )}
        {showLoadButton && (
          <button className="load-game-button" onClick={handleLoadGame}>
            Load Game
          </button>
        )}
        <DoneButton disabled={actionButton.disabled} onClick={actionButton.onClick} isDone={actionButton.isDone} />
      </div>
    </div>
  );
}

export default PlayerArea;
