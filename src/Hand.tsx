import { useRef, useEffect, useState } from "react";
import Card from "./Card";
import "./Hand.css";

interface HandProps {
  cards: number[];
  player: "raptor" | "scientist";
  onCardSelect?: (value: number) => void;
  selectedCard?: number | null;
  deckPosition?: { x: number; y: number };
  isNewDraw?: boolean;
}

function Hand({
  cards,
  player,
  onCardSelect,
  selectedCard,
  deckPosition,
  isNewDraw = false,
}: HandProps) {
  const handRef = useRef<HTMLDivElement>(null);
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);

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

  return (
    <div className={`Hand ${player}`} ref={handRef}>
      <div className="hand-label">
        {player === "raptor" ? "Raptor" : "Scientist"} Hand
      </div>
      <div className="hand-cards">
        {animatedCards.map((value, index) => (
          <Card
            key={`${value}-${index}`}
            value={value}
            player={player}
            faceUp={true}
            onClick={onCardSelect ? () => onCardSelect(value) : undefined}
            selected={selectedCard === value}
            initialPosition={
              isNewDraw && deckPosition ? deckPosition : undefined
            }
            animationDelay={isNewDraw ? index * 0.15 : 0}
          />
        ))}
      </div>
    </div>
  );
}

export default Hand;
