import Card from "../Card";
import type { CardInfo } from "@/data/cards.ts";
import "./DiscardPile.css";

interface DiscardPileProps {
  discardPile: CardInfo[];
}

function DiscardPile({ discardPile }: DiscardPileProps) {
  return (
    <div className="DiscardPile">
      {discardPile.length === 0 ? (
        <div className="discard-placeholder">Discard</div>
      ) : (
        <div className="discard-cards">
          {discardPile.map((card) => (
            <div key={card.id} className="discard-card-wrapper">
              <Card card={card} faceUp layoutId={`card-${card.id}`} hideTooltip />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiscardPile;
