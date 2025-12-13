import Card from "../Card";
import PrivacyScreen from "./PrivacyScreen";
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

  const handClassName = `Hand ${player}${isThisPlayerSelecting ? " selecting" : ""}`;

  return (
    <div className={handClassName}>
      <div className="hand-cards">
        {handCards.map((card, index) => {
          const isSelected = card.id === selectedCardId;

          // During CARD_REVEAL, don't render the selected card - it's in the reveal
          if (isCardReveal && isSelected) {
            return null;
          }

          const isDimmed = hasSelection && !isSelected;
          // During observation, show the selected card face-up
          const revealedByObservation = observationRevealsCard && isSelected;
          const cardFaceDown = revealedByObservation ? false : faceDown || (faceDownUnselected && !isSelected);

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
      <PrivacyScreen
        player={player}
        visible={showPrivacyScreen}
        onDismiss={() => dispatch({ type: "DISMISS_PRIVACY", player })}
      />
    </div>
  );
}

export default Hand;
