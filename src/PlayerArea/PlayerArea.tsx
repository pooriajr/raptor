import CardDeck from "./CardDeck";
import Hand from "./Hand";
import DiscardPile from "./DiscardPile";
import DoneButton from "./DoneButton";
import UndoButton from "./UndoButton";
import Tracker from "./Tracker";
import { useGame } from "../state/GameContext";
import { isMotherPlaced, countPlacedBabies, countPlacedScientists } from "../utils/pieceUtils";
import { getEffectPlayer, getEffectInstruction } from "../utils/effectUtils";
import { hasSavedGame, loadGame } from "../utils/saveLoad";
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

  // Derive card state from context
  const cards = isRaptor ? state.raptorCards : state.scientistCards;

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

  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  // === Compute action info ===

  const getActionInstruction = (): string => {
    if (state.actionPoints === 0) {
      return "No action points remaining";
    }
    return isRaptor ? "Select a piece, then click to move or act" : "Select a scientist, then click to move or act";
  };

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

  const showLoadButton = isRaptor && state.phase === "RAPTOR_SETUP" && hasSavedGame();

  return (
    <div className={`player-area ${player}-area`}>
      <div className="player-area-left">
        <CardDeck player={player} cardCount={cards.deck.length} />
        <DiscardPile player={player} />

        {isRaptor ? (
          <>
            <Tracker label="Escaped" emoji="🦎" current={state.escapedBabies ?? 0} max={3} />
            <Tracker label="Mother Sleep Tokens" emoji="💉" current={state.motherSleepTokens ?? 0} max={5} />
          </>
        ) : (
          <Tracker label="Captured" emoji="🦎" current={state.capturedBabies ?? 0} max={3} />
        )}
      </div>

      <div className="player-area-center">
        <Hand
          cards={cards.hand}
          player={player}
          faceDown={handFaceDown}
          playedCard={isThisPlayerSelecting ? null : cards.played}
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
        <DoneButton player={player} />
      </div>
    </div>
  );
}

export default PlayerArea;
