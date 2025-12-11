import Card from "../Card";
import "./CardDeck.css";

interface CardDeckProps {
  player: "raptor" | "scientist";
  deck: number[];
}

function CardDeck({ player, deck }: CardDeckProps) {
  return (
    <div className={`CardDeck ${player}`}>
      <div className="deck-stack">
        {deck.length === 0 ? (
          <div className="deck-placeholder" />
        ) : (
          <div className="deck-stack-inner">
            {[...deck].reverse().map((cardValue, index) => (
              <div
                key={cardValue}
                className="deck-card-wrapper"
                style={{
                  transform: `translate(${-index * 2}px, ${-index * 2}px)`,
                }}
              >
                <Card value={cardValue} player={player} faceUp={false} layoutId={`card-${player}-${cardValue}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CardDeck;
