import { useEffect, useState } from "react";
import Card from "../Card";
import { useGame } from "../state/GameContext";
import type { CardInfo, CardId } from "@/data/cards.ts";
import "./Hand.css";

interface HandProps {
  player: "raptor" | "scientist";
}

const HAND_SIZE = 3;

function Hand({ player }: HandProps) {
  const { state, dispatch } = useGame();
  const isRaptor = player === "raptor";

  // Get state from context
  const interaction = isRaptor ? state.raptorInteraction : state.scientistInteraction;
  const cards = isRaptor ? state.raptorCards : state.scientistCards;
  const handCards = cards.hand;
  const isNewDraw = interaction.isNewDraw;

  // Compute display modes based on phase
  const isSetupPhase = state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP";
  const isReadyPhase = state.phase === "SCIENTIST_READY" || state.phase === "RAPTOR_READY";

  const isThisPlayerSelecting =
    (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

  const isOpponentSelecting =
    (player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "SCIENTIST_CARD_SELECTION");

  // Derive props from state
  const showPlaceholders = isSetupPhase || isReadyPhase;
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

  const canSelect = !showPlaceholders && !faceDown;

  // Animation state - track card IDs for staggered animation
  const [animatedCards, setAnimatedCards] = useState<CardInfo[]>([]);

  useEffect(() => {
    if (!isNewDraw) {
      setAnimatedCards(handCards);
      return;
    }

    setAnimatedCards([]);
    const timeouts = handCards.map((card, i) => setTimeout(() => setAnimatedCards((prev) => [...prev, card]), i * 100));
    return () => timeouts.forEach(clearTimeout);
  }, [handCards, isNewDraw]);

  const hasSelection = selectedCardId != null;

  if (showPlaceholders) {
    return (
      <div className={`Hand ${player} placeholder-mode`}>
        <div className="hand-cards">
          {Array.from({ length: HAND_SIZE }).map((_, index) => (
            <div key={index} className="card-wrapper">
              <div className="card-placeholder" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`Hand ${player}`}>
      <div className="hand-cards">
        {Array.from({ length: HAND_SIZE }).map((_, index) => {
          const card = animatedCards[index];
          const hasCard = card !== undefined;
          const isSelected = hasCard && card.id === selectedCardId;
          const isPlayed = hasCard && playedCard !== null && card.id === playedCard.id;
          const isFloating = hasCard && floatingCard !== null && card.id === floatingCard.id;
          const hasFloating = floatingCard != null;
          const isDimmed = hasCard && ((hasSelection && !isSelected && !isPlayed) || (hasFloating && !isFloating));
          const cardFaceDown = faceDown || (faceDownUnselected && !isSelected && !isPlayed);

          return (
            <div key={index} className="card-wrapper">
              {isNewDraw && <div className="card-placeholder card-placeholder-under" />}
              {hasCard && (
                <Card
                  card={card}
                  faceUp={!cardFaceDown}
                  onClick={!cardFaceDown && canSelect ? () => handleCardSelect(card.id) : undefined}
                  selected={isSelected || isPlayed}
                  dimmed={isDimmed}
                  floating={isFloating}
                  layoutId={`card-${card.id}`}
                />
              )}
              {!hasCard && !isNewDraw && <div className="card-placeholder" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Hand;
