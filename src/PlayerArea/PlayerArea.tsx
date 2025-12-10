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

  const interaction = isRaptor ? state.raptorInteraction : state.scientistInteraction;
  const cards = isRaptor ? state.raptorCards : state.scientistCards;

  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";

  const isThisPlayerSelecting =
    (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhase && state.activePlayer === player;

  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  const getActionInstruction = (): string => {
    if (state.actionPoints === 0) {
      return "No action points remaining";
    }
    return isRaptor ? "Select a piece, then click to move or act" : "Select a scientist, then click to move or act";
  };

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
        instruction: interaction.selectedCard
          ? `Card ${interaction.selectedCard} selected`
          : "Select a card from your hand",
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
        <Hand player={player} />
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
