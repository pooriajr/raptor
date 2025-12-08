import "./CardDeck.css";

interface CardDeckProps {
  player: "raptor" | "scientist";
  cardCount: number;
}

function CardDeck({ player, cardCount }: CardDeckProps) {
  // Create offset cards for the stack effect (show up to 4 cards in stack)
  const stackLayers = Math.min(cardCount, 4);

  return (
    <div className={`CardDeck ${player}`}>
      <div className="deck-label">{player === "raptor" ? "Raptor" : "Scientist"}</div>
      <div className="deck-stack">
        {Array.from({ length: stackLayers }).map((_, index) => (
          <div
            key={index}
            className="card card-back"
            style={{
              transform: `translate(${index * 2}px, ${index * 2}px)`,
              zIndex: stackLayers - index,
            }}
          >
            <div className="card-pattern">{player === "raptor" ? "🦖" : "🔬"}</div>
          </div>
        ))}
      </div>
      <div className="card-count">{cardCount} cards</div>
    </div>
  );
}

export default CardDeck;
