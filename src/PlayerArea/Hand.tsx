import Card from "../Card";
import PrivacyScreen from "./PrivacyScreen";
import { useGame } from "../state/GameContext";
import type { CardId, CardInfo } from "@/data/cards.ts";

interface HandDisplayProps {
  player: "raptor" | "scientist";
  cards: CardInfo[];
  selectedCardId?: CardId | null;
  onCardSelect?: (cardId: CardId) => void;
  selecting?: boolean;
  static?: boolean;
  faceUp?: boolean;
  // Granular controls (these are all implied by static=true)
  skipEntryAnimation?: boolean;
  hideTooltips?: boolean;
  staticFan?: boolean;
}

// Get fan animation class based on card index and total cards
function getFanClass(index: number, totalCards: number, isStatic: boolean): string {
  if (isStatic) {
    // Static: apply final transforms directly, no animation
    if (totalCards === 3) {
      if (index === 0) return "-rotate-[5deg]";
      if (index === 1) return "-translate-y-2.5";
      if (index === 2) return "rotate-[5deg]";
    } else if (totalCards === 2) {
      if (index === 0) return "-rotate-[5deg]";
      if (index === 1) return "rotate-[5deg]";
    }
    return "";
  }
  // Animated: use keyframe animations
  if (totalCards === 3) {
    if (index === 0) return "animate-fan-left";
    if (index === 1) return "animate-fan-middle";
    if (index === 2) return "animate-fan-right";
  } else if (totalCards === 2) {
    if (index === 0) return "animate-fan-left";
    if (index === 1) return "animate-fan-right";
  }
  return "";
}

// Presentational component - renders a hand of cards with no state management
export function HandDisplay({
  player,
  cards,
  selectedCardId = null,
  onCardSelect,
  selecting = false,
  static: isStatic = false,
  faceUp = true,
  skipEntryAnimation = false,
  hideTooltips = false,
  staticFan = false,
}: HandDisplayProps) {
  const hasSelection = selectedCardId != null;
  const isRaptor = player === "raptor";

  // static implies all granular controls
  const shouldSkipEntryAnimation = skipEntryAnimation || isStatic;
  const shouldHideTooltips = hideTooltips || isStatic;
  const shouldStaticFan = staticFan || isStatic;

  const handClasses = [
    "flex flex-col items-center transition-transform duration-300 ease-in-out relative",
    isRaptor ? "origin-top" : "origin-bottom",
    selecting ? "scale-[1.2]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={handClasses} style={isStatic ? { pointerEvents: "none" } : undefined}>
      <div className="flex [perspective:1000px] relative">
        {cards.map((card, index) => {
          const isSelected = card.id === selectedCardId;
          const isDimmed = hasSelection && !isSelected;
          const fanClass = getFanClass(index, cards.length, shouldStaticFan);

          return (
            <div
              key={card.id}
              className={`relative z-[1] first:ml-0 -ml-[15px] hover:z-10 has-[.selected]:z-10 ${fanClass}`}
            >
              <Card
                card={card}
                faceUp={faceUp}
                onClick={onCardSelect ? () => onCardSelect(card.id) : undefined}
                selected={isSelected}
                dimmed={isDimmed}
                layoutId={shouldSkipEntryAnimation ? undefined : `card-${card.id}`}
                layoutDelay={index * 0.1 + 0.1}
                skipAnimation={shouldSkipEntryAnimation}
                hideTooltip={shouldHideTooltips}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HandProps {
  player: "raptor" | "scientist";
}

// Container component - manages state and passes to HandDisplay
function Hand({ player }: HandProps) {
  const { state, dispatch } = useGame();
  const isRaptor = player === "raptor";

  // Get state from context
  const interaction = isRaptor ? state.raptorInteraction : state.scientistInteraction;
  const cards = isRaptor ? state.raptorCards : state.scientistCards;
  const handCards = cards.hand;

  // Compute display modes based on phase
  const isThisPlayerSelecting =
    (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

  const isOpponentSelecting =
    (player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "SCIENTIST_CARD_SELECTION");

  // Observation: raptor can see scientist's selected card during raptor's card selection
  const observationRevealsCard =
    player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION" && state.mother.observationActive;

  const isCardReveal = state.phase === "CARD_REVEAL";

  const showPrivacyScreen = isThisPlayerSelecting && !interaction.privacyDismissed;

  const faceDown = isOpponentSelecting || showPrivacyScreen;
  const faceDownUnselected = !isThisPlayerSelecting || showPrivacyScreen;
  const selectedCardId = interaction.selectedCard;

  // Card selection handler
  const handleCardSelect = (cardId: CardId) => {
    if (!isThisPlayerSelecting || showPrivacyScreen) return;
    const newCard = interaction.selectedCard === cardId ? null : cardId;
    dispatch({ type: "SELECT_CARD", player, card: newCard });
  };

  const canSelect = !faceDown && !showPrivacyScreen;
  const hasSelection = selectedCardId != null;

  const handClasses = [
    "flex flex-col items-center transition-transform duration-300 ease-in-out relative",
    isRaptor ? "origin-top" : "origin-bottom",
    isThisPlayerSelecting ? "scale-[1.2]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Filter out cards that shouldn't render (during CARD_REVEAL, the selected card is shown elsewhere)
  const visibleCards = handCards.filter((card) => !(isCardReveal && card.id === selectedCardId));

  return (
    <div className={handClasses}>
      <div className="flex [perspective:1000px] relative">
        {visibleCards.map((card, index) => {
          const isSelected = card.id === selectedCardId;
          const isDimmed = hasSelection && !isSelected;
          // During observation, show the selected card face-up
          const revealedByObservation = observationRevealsCard && isSelected;
          const cardFaceDown = revealedByObservation ? false : faceDown || (faceDownUnselected && !isSelected);
          const fanClass = getFanClass(index, visibleCards.length, false);

          return (
            <div
              key={card.id}
              className={`relative z-[1] first:ml-0 -ml-[15px] hover:z-10 has-[.selected]:z-10 ${fanClass}`}
            >
              <Card
                card={card}
                faceUp={!cardFaceDown}
                onClick={!cardFaceDown && canSelect ? () => handleCardSelect(card.id) : undefined}
                selected={isSelected}
                dimmed={isDimmed}
                layoutId={`card-${card.id}`}
                layoutDelay={index * 0.1 + 0.1}
              />
            </div>
          );
        })}
      </div>
      <PrivacyScreen
        player={player}
        visible={showPrivacyScreen}
        onDismiss={() => dispatch({ type: "DISMISS_PRIVACY", player })}
      />
    </div>
  );
}

export default Hand;
