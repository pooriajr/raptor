import Card from "../Card";
import { useGame } from "../state/GameContext";
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
  const selectedCard = isThisPlayerSelecting ? interaction.selectedCard : null;
  const playedCard = isThisPlayerSelecting ? null : cards.played;
  const floatingCard =
    player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION" ? state.scientistCards.played : null;

  // Card selection handler
  const handleCardSelect = (value: number) => {
    if (!isThisPlayerSelecting) return;
    const newCard = interaction.selectedCard === value ? null : value;
    dispatch({ type: "SELECT_CARD", player, card: newCard });
  };

  const canSelect = !faceDown;
  const hasSelection = selectedCard != null;
  const hasFloating = floatingCard != null;

  return (
    <div className={`Hand ${player}`}>
      <div className="hand-cards">
        {handCards.map((value) => {
          const isSelected = value === selectedCard;
          const isPlayed = value === playedCard;
          const isFloating = value === floatingCard;
          const isDimmed = (hasSelection && !isSelected && !isPlayed) || (hasFloating && !isFloating);
          const cardFaceDown = faceDown || (faceDownUnselected && !isSelected && !isPlayed);

          return (
            <div key={value} className="card-wrapper">
              <Card
                value={value}
                player={player}
                faceUp={!cardFaceDown}
                onClick={!cardFaceDown && canSelect ? () => handleCardSelect(value) : undefined}
                selected={isSelected || isPlayed}
                dimmed={isDimmed}
                floating={isFloating}
                layoutId={`card-${player}-${value}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Hand;
