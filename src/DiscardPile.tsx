import Card from "./Card";
import { useGame } from "./state/GameContext";
import "./DiscardPile.css";

interface DiscardPileProps {
  player: "raptor" | "scientist";
}

function DiscardPile({ player }: DiscardPileProps) {
  const { state } = useGame();
  const cards = player === "raptor" ? state.raptorCards : state.scientistCards;
  const discardPile = cards.discard;

  if (discardPile.length === 0) {
    return <div className="discard-placeholder">Discard</div>;
  }

  return (
    <div className="discard-pile">
      {discardPile.map((cardValue, index) => (
        <div
          key={`${cardValue}-${index}`}
          className="discard-card-wrapper"
          style={{ marginLeft: index > 0 ? "-30px" : "0" }}
        >
          <Card value={cardValue} player={player} faceUp />
        </div>
      ))}
    </div>
  );
}

export default DiscardPile;
