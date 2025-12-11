import Card from "../Card";
import type { CardInfo } from "@/data/cards.ts";
import "./CardDeck.css";

interface CardDeckProps {
  deck: CardInfo[];
}

function CardDeck({ deck }: CardDeckProps) {
  return (
    <div className={`CardDeck ${deck[0]?.player ?? "raptor"}`}>
      <div className="deck-stack">
        {deck.length === 0 ? (
          <div className="deck-placeholder" />
        ) : (
          <div className="deck-stack-inner">
            {[...deck].reverse().map((card, index) => (
              <div
                key={card.id}
                className="deck-card-wrapper"
                style={{
                  transform: `translate(${-index * 2}px, ${-index * 2}px)`,
                }}
              >
                <Card card={card} faceUp={false} layoutId={`card-${card.id}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CardDeck;
