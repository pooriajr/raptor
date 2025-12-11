import CardDeck from "./CardDeck";
import Hand from "./Hand";
import DiscardPile from "./DiscardPile";
import DoneButton from "./DoneButton";
import UndoButton from "./UndoButton";
import { useGame } from "../state/GameContext";
import { getEffectPlayer, getEffectInstruction } from "../utils/effectUtils";
import { hasSavedGame, loadGame } from "../utils/saveLoad";
import type { CardState, InteractionState } from "../types/gameState";
import "./PlayerArea.css";

interface SetupInfo {
  phaseLabel: string;
  progress: React.ReactNode;
  instruction: string;
}

interface PlayerAreaBaseProps {
  player: "raptor" | "scientist";
  cards: CardState;
  interaction: InteractionState;
  trackers: React.ReactNode;
  setupInfo: SetupInfo | null;
  isSelectingCard: boolean;
  actionInstruction: string;
}

function PlayerAreaBase({
  player,
  cards,
  interaction,
  trackers,
  setupInfo,
  isSelectingCard,
  actionInstruction,
}: PlayerAreaBaseProps) {
  const { state, dispatch } = useGame();

  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";

  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhase && state.activePlayer === player;

  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  const actionInfo = (() => {
    if (setupInfo) {
      return setupInfo;
    }
    if (isSelectingCard) {
      return {
        phaseLabel: "Pick a Card",
        progress: null,
        instruction: interaction.selectedCard
          ? `Card ${interaction.selectedCard} selected`
          : "Select a card from your hand",
      };
    }
    if (isThisPlayerEffect) {
      return {
        phaseLabel: "Effect Phase",
        progress: null,
        instruction: getEffectInstruction(state),
      };
    }
    if (isThisPlayerAction) {
      return {
        phaseLabel: "Action Phase",
        progress: null,
        instruction: actionInstruction,
        actionPoints: state.actionPoints,
      };
    }
    return null;
  })();

  const showLoadButton = player === "raptor" && state.phase === "RAPTOR_SETUP" && hasSavedGame();

  return (
    <div className={`player-area ${player}-area`}>
      <div className="player-area-left">
        <CardDeck player={player} cardCount={cards.deck.length} />
        <DiscardPile player={player} />
        {trackers}
      </div>

      <div className="player-area-center">
        <Hand player={player} />
      </div>

      <div className="player-area-action">
        {actionInfo && (
          <div className="action-info">
            {"actionPoints" in actionInfo && actionInfo.actionPoints !== undefined && (
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

export default PlayerAreaBase;
