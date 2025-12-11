import { LayoutGroup } from "framer-motion";
import CardDeck from "./CardDeck";
import Hand from "./Hand";
import DiscardPile from "./DiscardPile";
import DoneButton from "./DoneButton";
import UndoButton from "./UndoButton";
import { useGame } from "../state/GameContext";
import { getEffectPlayer, getEffectInstruction } from "../utils/effectUtils";
import { CARDS } from "@/data/cards.ts";
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
  const { state } = useGame();

  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";

  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhase && state.activePlayer === player;

  const actionInfo = (() => {
    if (setupInfo) {
      return setupInfo;
    }
    if (isSelectingCard) {
      const selectedCardInfo = interaction.selectedCard ? CARDS[interaction.selectedCard] : null;
      return {
        phaseLabel: "Pick a Card",
        progress: null,
        instruction: selectedCardInfo ? `Card ${selectedCardInfo.value} selected` : "Select a card from your hand",
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

  return (
    <LayoutGroup id={`${player}-cards`}>
      <div className={`player-area ${player}-area`}>
        <div className="player-area-left">
          <CardDeck deck={cards.deck} />
          <DiscardPile discardPile={cards.discard} />
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
          <DoneButton player={player} />
        </div>
      </div>
    </LayoutGroup>
  );
}

export default PlayerAreaBase;
