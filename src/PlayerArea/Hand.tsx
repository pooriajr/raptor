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
  const selectedCardId = interaction.selectedCard;

  // Card selection handler
  const handleCardSelect = (cardId: CardId) => {
    if (!isThisPlayerSelecting) return;
    const newCard = interaction.selectedCard === cardId ? null : cardId;
    dispatch({ type: "SELECT_CARD", player, card: newCard });
  };

  const canSelect = !faceDown;
  const hasSelection = selectedCardId != null;

  return (
    <div className={`Hand ${player}`}>
      <div className="hand-cards">
        {handCards.map((card, index) => {
          const isSelected = card.id === selectedCardId;
          const isDimmed = hasSelection && !isSelected;
          const cardFaceDown = faceDown || (faceDownUnselected && !isSelected);

          return (
            <div key={card.id} className="card-wrapper">
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
    </div>
  );
}

export default Hand;
