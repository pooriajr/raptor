import Card from "../Card";
import { useGame } from "../state/GameContext";
import type { CardId } from "@/data/cards.ts";
import "./Hand.css";

interface HandProps {
  player: "raptor" | "scientist";
}

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

  const faceDown = isOpponentSelecting;
  const faceDownUnselected = !isThisPlayerSelecting;
  const selectedCardId = isThisPlayerSelecting ? interaction.selectedCard : null;
  const playedCard = isThisPlayerSelecting ? null : cards.played;
  const floatingCard =
    player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION" ? state.scientistCards.played : null;

  // Card selection handler
  const handleCardSelect = (cardId: CardId) => {
    if (!isThisPlayerSelecting) return;
    const newCard = interaction.selectedCard === cardId ? null : cardId;
    dispatch({ type: "SELECT_CARD", player, card: newCard });
  };

  const canSelect = !faceDown;
  const hasSelection = selectedCardId != null;
  const hasFloating = floatingCard != null;

  return (
    <div className={`Hand ${player}`}>
      <div className="hand-cards">
        {handCards.map((card, index) => {
          const isSelected = card.id === selectedCardId;
          const isPlayed = playedCard !== null && card.id === playedCard.id;
          const isFloating = floatingCard !== null && card.id === floatingCard.id;
          const isDimmed = (hasSelection && !isSelected && !isPlayed) || (hasFloating && !isFloating);
          const cardFaceDown = faceDown || (faceDownUnselected && !isSelected && !isPlayed);

          return (
            <div key={card.id} className="card-wrapper">
              <Card
                card={card}
                faceUp={!cardFaceDown}
                onClick={!cardFaceDown && canSelect ? () => handleCardSelect(card.id) : undefined}
                selected={isSelected || isPlayed}
                dimmed={isDimmed}
                floating={isFloating}
                layoutId={`card-${card.id}`}
                layoutDelay={index * 0.1 + 0.1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Hand;
