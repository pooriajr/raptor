import { useGame } from "./state/GameContext.tsx";
import { CARDS } from "@/data/cards.ts";
import "./CardResolution.css";

function CardResolution() {
  const { state } = useGame();

  const scientistCardId = state.scientistInteraction.selectedCard;
  const raptorCardId = state.raptorInteraction.selectedCard;
  const scientistCard = scientistCardId ? CARDS[scientistCardId] : null;
  const raptorCard = raptorCardId ? CARDS[raptorCardId] : null;

  // Determine who gets effect vs action points
  const showResolution = state.phase === "CARD_REVEAL" && scientistCard && raptorCard;

  let raptorContent = null;
  let scientistContent = null;

  if (showResolution) {
    const tied = scientistCard.value === raptorCard.value;
    const raptorLower = raptorCard.value < scientistCard.value;
    const difference = Math.abs(raptorCard.value - scientistCard.value);

    if (tied) {
      raptorContent = <span className="tied">Tied</span>;
      scientistContent = <span className="tied">Tied</span>;
    } else if (raptorLower) {
      raptorContent = (
        <div className="effect">
          <span className="icon">{raptorCard.icon}</span>
          <span className="label">{raptorCard.name}</span>
        </div>
      );
      scientistContent = (
        <div className="action-points">
          <span className="number">{difference}</span>
          <span className="label">AP</span>
        </div>
      );
    } else {
      scientistContent = (
        <div className="effect">
          <span className="icon">{scientistCard.icon}</span>
          <span className="label">{scientistCard.name}</span>
        </div>
      );
      raptorContent = (
        <div className="action-points">
          <span className="number">{difference}</span>
          <span className="label">AP</span>
        </div>
      );
    }
  }

  return (
    <div className="CardResolution">
      <div className="half raptor">{raptorContent}</div>
      <div className="divider" />
      <div className="half scientist">{scientistContent}</div>
    </div>
  );
}

export default CardResolution;
