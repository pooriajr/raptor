import { useEffect, useState } from "react";
import Card from "./Card";
import "./Hand.css";

const CARD_WIDTH = 100;
const CARD_GAP = 12;

interface HandProps {
  cards: number[];
  player: "raptor" | "scientist";
  onCardSelect?: (value: number) => void;
  onConfirm?: () => void;
  selectedCard?: number | null;
  playedCard?: number | null;
  faceDown?: boolean;
  deckPosition?: { x: number; y: number };
  isNewDraw?: boolean;
}

function Hand({
  cards,
  player,
  onCardSelect,
  onConfirm,
  selectedCard,
  playedCard,
  faceDown = false,
  deckPosition,
  isNewDraw = false,
}: HandProps) {
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  useEffect(() => {
    setShowConfirmButton(false);
  }, [selectedCard]);

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

  // Calculate offset to center the elevated card
  const getElevatedOffset = (index: number) => {
    const centerIndex = (animatedCards.length - 1) / 2;
    return (centerIndex - index) * (CARD_WIDTH + CARD_GAP);
  };

  return (
    <div className={`Hand ${player}`}>
      <div className="hand-label">{player === "raptor" ? "Raptor" : "Scientist"} Hand</div>

      <div className="hand-cards">
        {animatedCards.map((value, index) => {
          const isSelected = value === selectedCard;
          const isPlayed = value === playedCard;
          const isElevated = isSelected || isPlayed;

          return (
            <div key={`${value}-${index}`} className="card-wrapper">
              <Card
                value={value}
                player={player}
                faceUp={!faceDown}
                onClick={!faceDown && onCardSelect ? () => onCardSelect(value) : undefined}
                selected={isElevated}
                selectedOffsetX={isElevated ? getElevatedOffset(index) : 0}
                initialPosition={isNewDraw ? deckPosition : undefined}
                animationDelay={isNewDraw ? index * 0.15 : 0}
                onSelectionComplete={isSelected ? () => setShowConfirmButton(true) : undefined}
              />
            </div>
          );
        })}
        {showConfirmButton && selectedCard != null && onConfirm && (
          <button className="confirm-button" onClick={onConfirm}>
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}

export default Hand;
