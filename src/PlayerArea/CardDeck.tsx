import Card from "../Card";
import type { CardInfo } from "@/data/cards.ts";

interface CardDeckProps {
  deck: CardInfo[];
}

function CardDeck({ deck }: CardDeckProps) {
  return (
    <div className="flex origin-center scale-[0.85] flex-col items-center">
      <div className="relative h-52.5 w-37.5">
        {deck.length === 0 ? (
          <div className="h-52.5 w-37.5 rounded-xl border-2 border-dashed border-[#555]" />
        ) : (
          <div className="absolute inset-0">
            {[...deck].reverse().map((card, index) => (
              <div
                key={card.id}
                className="absolute"
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
