import Card from "../Card";
import { useGame } from "../state/GameContext";
import "./DiscardPile.css";

interface DiscardPileProps {
  player: "raptor" | "scientist";
}

function DiscardPile({ player }: DiscardPileProps) {
  const { state } = useGame();
  const cards = player === "raptor" ? state.raptorCards : state.scientistCards;
  const discardPile = cards.discard;

  return (
    <div className="DiscardPile">
      {discardPile.length === 0 ? (
        <div className="discard-placeholder">Discard</div>
      ) : (
        <div className="discard-cards">
          {discardPile.map((cardValue, index) => (
            <div key={`${cardValue}-${index}`} className="discard-card-wrapper">
              <Card value={cardValue} player={player} faceUp layoutId={`card-${player}-${cardValue}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiscardPile;
