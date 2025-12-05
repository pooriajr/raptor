import { useRef, useEffect, useState } from "react";
import Card from "./Card";
import "./Hand.css";

interface HandProps {
  cards: number[];
  player: "raptor" | "scientist";
  onCardSelect?: (value: number) => void;
  onConfirm?: () => void;
  selectedCard?: number | null;
  deckPosition?: { x: number; y: number };
  isNewDraw?: boolean;
}

function Hand({
  cards,
  player,
  onCardSelect,
  onConfirm,
  selectedCard,
  deckPosition,
  isNewDraw = false,
}: HandProps) {
  const handRef = useRef<HTMLDivElement>(null);
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  // Reset confirm button visibility when selection changes
  useEffect(() => {
    setShowConfirmButton(false);
  }, [selectedCard]);

  // Calculate the x offset needed to center the selected card
  const selectedIndex =
    selectedCard != null ? animatedCards.indexOf(selectedCard) : -1;
  const cardWidth = 100; // Card width in px
  const cardGap = 12; // Gap between cards
  const totalCards = animatedCards.length;
  // Center position is at index (totalCards - 1) / 2
  // Offset = (selectedIndex - centerIndex) * (cardWidth + gap)
  const centerIndex = (totalCards - 1) / 2;
  const selectedOffsetX =
    selectedIndex >= 0
      ? (selectedIndex - centerIndex) * (cardWidth + cardGap)
      : 0;

  // Track which cards have been animated in
  useEffect(() => {
    if (isNewDraw) {
      // Reset and animate new cards
      setAnimatedCards([]);
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      cards.forEach((card, index) => {
        const timeout = setTimeout(() => {
          setAnimatedCards((prev) => [...prev, card]);
        }, index * 100); // Stagger the reveal
        timeouts.push(timeout);
      });
      return () => timeouts.forEach(clearTimeout);
    } else {
      // Cards are already in hand, no animation needed
      setAnimatedCards(cards);
    }
  }, [cards, isNewDraw]);

  const isSelected = (value: number) => selectedCard === value;

  return (
    <div className={`Hand ${player}`} ref={handRef}>
      <div className="hand-label">
        {player === "raptor" ? "Raptor" : "Scientist"} Hand
      </div>

      <div className="hand-cards">
        {animatedCards.map((value, index) => (
          <div key={`${value}-${index}`} className="card-wrapper">
            <Card
              value={value}
              player={player}
              faceUp={true}
              onClick={onCardSelect ? () => onCardSelect(value) : undefined}
              selected={isSelected(value)}
              selectedOffsetX={isSelected(value) ? -selectedOffsetX : undefined}
              initialPosition={
                isNewDraw && deckPosition ? deckPosition : undefined
              }
              animationDelay={isNewDraw ? index * 0.15 : 0}
              onSelectionComplete={() => setShowConfirmButton(true)}
            />
          </div>
        ))}
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
