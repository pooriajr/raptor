import { useEffect, useState } from "react";
import Card from "./Card";
import "./Hand.css";

interface HandProps {
  cards: number[];
  player: "raptor" | "scientist";
  onCardSelect?: (value: number) => void;
  selectedCard?: number | null;
  playedCard?: number | null;
  floatingCard?: number | null; // Card that should have floating animation
  faceDown?: boolean;
  deckPosition?: { x: number; y: number };
  isNewDraw?: boolean;
  hideUnselected?: boolean;
  showPlaceholders?: boolean;
}

const HAND_SIZE = 3;

function Hand({
  cards,
  player,
  onCardSelect,
  selectedCard,
  playedCard,
  floatingCard,
  faceDown = false,
  deckPosition,
  isNewDraw = false,
  hideUnselected = false,
  showPlaceholders = false,
}: HandProps) {
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);

  // Animate cards appearing one by one on new draw
  useEffect(() => {
    if (!isNewDraw) {
      setAnimatedCards(cards);
      return;
    }

    setAnimatedCards([]);
    const timeouts = cards.map((card, i) => setTimeout(() => setAnimatedCards((prev) => [...prev, card]), i * 100));
    return () => timeouts.forEach(clearTimeout);
  }, [cards, isNewDraw]);

  const hasSelection = selectedCard != null;

  // When showing placeholders, render empty card slots
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
          const value = animatedCards[index];
          const hasCard = value !== undefined;
          const isSelected = hasCard && value === selectedCard;
          const isPlayed = hasCard && value === playedCard;
          const isFloating = hasCard && value === floatingCard;
          const hasFloating = floatingCard != null;
          const isDimmed = hasCard && ((hasSelection && !isSelected && !isPlayed) || (hasFloating && !isFloating));
          const isHidden = hasCard && hideUnselected && !isSelected && !isPlayed;

          return (
            <div key={index} className={`card-wrapper ${isHidden ? "hidden" : ""}`}>
              {/* Show placeholder underneath during animation */}
              {isNewDraw && <div className="card-placeholder card-placeholder-under" />}
              {hasCard && (
                <Card
                  value={value}
                  player={player}
                  faceUp={!faceDown}
                  onClick={!faceDown && onCardSelect ? () => onCardSelect(value) : undefined}
                  selected={isSelected || isPlayed}
                  dimmed={isDimmed}
                  floating={isFloating}
                  initialPosition={isNewDraw ? deckPosition : undefined}
                  animationDelay={isNewDraw ? index * 0.15 : 0}
                />
              )}
              {/* Show placeholder when no card yet (not during new draw) */}
              {!hasCard && !isNewDraw && <div className="card-placeholder" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Hand;
