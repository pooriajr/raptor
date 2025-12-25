import CardDeck from "./CardDeck";
import Hand from "./Hand";
import DiscardPile from "./DiscardPile";
import DoneButton from "./DoneButton";
import { useGame } from "../state/GameContext";
import { getEffectPlayer, getEffectInstruction } from "../utils/effectUtils";
import { CARDS } from "@/data/cards.ts";
import type { CardState, InteractionState } from "../types/gameState";
import { isActionPhaseForPlayer, isPhase } from "../state/guards.ts";

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

  const isEffectPhase = isPhase(state, "EFFECT_PHASE");
  const isRaptor = player === "raptor";

  const isThisPlayerEffect = isEffectPhase && getEffectPlayer(state) === player;
  const isThisPlayerAction = isActionPhaseForPlayer(state, player);

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

  const playerAreaClassName = [
    "relative z-[100] grid w-full grid-cols-[1fr_auto_1fr] items-center px-7 py-7",
    isRaptor
      ? "bg-[linear-gradient(135deg,#1a3318_0%,#2a4a25_100%)] border-b-2 border-[#3d6a37] transition-colors duration-300 group-[.active-scientist]:bg-[linear-gradient(135deg,rgba(26,51,24,0.3)_0%,rgba(42,74,37,0.3)_100%)]"
      : "bg-[linear-gradient(135deg,#3d2510_0%,#5a3810_100%)] border-t-2 border-[#e68a11] transition-colors duration-300 group-[.active-raptor]:bg-[linear-gradient(135deg,rgba(61,37,16,0.3)_0%,rgba(90,56,16,0.3)_100%)]",
    isRaptor
      ? "group-[.active-raptor]:border-b-0 group-[.active-raptor]:after:content-[''] group-[.active-raptor]:after:absolute group-[.active-raptor]:after:bottom-0 group-[.active-raptor]:after:left-0 group-[.active-raptor]:after:right-0 group-[.active-raptor]:after:h-0.5 group-[.active-raptor]:after:z-[-1] group-[.active-raptor]:after:bg-[linear-gradient(90deg,#2d5a27_0%,#2d5a27_30%,#90ee90_50%,#2d5a27_70%,#2d5a27_100%)] group-[.active-raptor]:after:[background-size:200%_100%] group-[.active-raptor]:after:animate-[gradient-flow_2s_linear_infinite]"
      : "group-[.active-scientist]:border-t-0 group-[.active-scientist]:after:content-[''] group-[.active-scientist]:after:absolute group-[.active-scientist]:after:top-0 group-[.active-scientist]:after:left-0 group-[.active-scientist]:after:right-0 group-[.active-scientist]:after:h-0.5 group-[.active-scientist]:after:z-[-1] group-[.active-scientist]:after:bg-[linear-gradient(90deg,#5a3810_0%,#5a3810_30%,#ffb347_50%,#5a3810_70%,#5a3810_100%)] group-[.active-scientist]:after:[background-size:200%_100%] group-[.active-scientist]:after:animate-[gradient-flow_2s_linear_infinite]",
    isRaptor ? "group-[.active-scientist]:opacity-60" : "group-[.active-raptor]:opacity-60",
  ].join(" ");

  return (
    <>
      <div className={playerAreaClassName}>
        <div className="flex items-center justify-start gap-8">
          <CardDeck deck={cards.deck} />
          <DiscardPile discardPile={cards.discard} />
        </div>

        <div className="flex items-center justify-center">
          <Hand player={player} />
        </div>

        <div className="flex h-full items-center justify-end gap-6">
          {actionInfo && (
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-2 text-right">
                <div className="text-[1.6rem] font-bold tracking-[2px] text-white uppercase">
                  {actionInfo.phaseLabel}
                </div>
                {actionInfo.progress && (
                  <div className="flex gap-4 text-[1.4rem] font-bold text-white">{actionInfo.progress}</div>
                )}
                <div className="max-w-80 text-[1.1rem] text-white/80">{actionInfo.instruction}</div>
              </div>
            </div>
          )}
          <DoneButton player={player} />
        </div>
      </div>
    </>
  );
}

export default PlayerAreaBase;
