import { LayoutGroup } from "framer-motion";
import CardDeck from "./CardDeck";
import Hand from "./Hand";
import DiscardPile from "./DiscardPile";
import DoneButton from "./DoneButton";
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
  setupInfo: SetupInfo | null;
  isSelectingCard: boolean;
  actionInstruction: string;
}

function PlayerAreaBase({
  player,
  cards,
  interaction,
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
        </div>

        <div className="player-area-center">
          <Hand player={player} />
        </div>

        <div className="player-area-action">
          {actionInfo && (
            <div className="action-info">
              <div className="action-text">
                <div className="action-phase-label">{actionInfo.phaseLabel}</div>
                {actionInfo.progress && <div className="action-progress">{actionInfo.progress}</div>}
                <div className="action-instruction">{actionInfo.instruction}</div>
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
