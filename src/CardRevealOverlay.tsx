import { useState, useEffect } from "react";
import Card from "./Card";
import { useGame } from "./state/GameContext";
import { CARDS, type CardInfo } from "@/data/cards.ts";
import "./CardRevealOverlay.css";

function CardRevealOverlay() {
  const { state, dispatch } = useGame();
  const [revealed, setRevealed] = useState(false);

  const scientistCardId = state.scientistInteraction.selectedCard;
  const raptorCardId = state.raptorInteraction.selectedCard;
  const scientistCard = scientistCardId ? CARDS[scientistCardId] : null;
  const raptorCard = raptorCardId ? CARDS[raptorCardId] : null;

  useEffect(() => {
    const timeout = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Both cards must be selected to show the reveal
  if (!scientistCard || !raptorCard) {
    return null;
  }

  const sameCards = scientistCard.value === raptorCard.value;
  const difference = Math.abs(scientistCard.value - raptorCard.value);
  const scientistWins = scientistCard.value < raptorCard.value;
  const winner = scientistWins ? "Scientist" : "Raptor";
  const actionPoints = `${difference} action point${difference > 1 ? "s" : ""}`;

  const renderEffectBox = (card: CardInfo, isWinner: boolean) => (
    <div className={`effect-box ${isWinner ? "winner" : "loser"}`}>
      <div className="effect-player">{card.player === "scientist" ? "Scientist" : "Raptor"}</div>
      <div className="effect-text">{isWinner ? `Uses card effect: ${card.name}` : `Gets ${actionPoints}`}</div>
    </div>
  );

  return (
    <div className="CardRevealOverlay">
      <div className="reveal-content">
        <h2 className="reveal-title">Card Reveal</h2>

        <div className="cards-comparison">
          <div className="reveal-card-section">
            <div className="player-label scientist">Scientist</div>
            <div className="reveal-card-wrapper">
              <Card card={scientistCard} faceUp={revealed} />
            </div>
          </div>

          <div className="vs-divider">VS</div>

          <div className="reveal-card-section">
            <div className="player-label raptor">Raptor</div>
            <div className="reveal-card-wrapper">
              <Card card={raptorCard} faceUp={revealed} />
            </div>
          </div>
        </div>

        {revealed && (
          <>
            {sameCards ? (
              <div className="result-section same-cards">
                <div className="result-title">Same Cards!</div>
                <div className="result-description">Nothing happens this round.</div>
              </div>
            ) : (
              <div className="result-section">
                <div className="effect-row">
                  {renderEffectBox(scientistCard, scientistWins)}
                  {renderEffectBox(raptorCard, !scientistWins)}
                </div>
                <div className="turn-order">{winner} acts first</div>
              </div>
            )}

            <button className="confirm-button" onClick={() => dispatch({ type: "ADVANCE_PHASE" })}>
              {sameCards ? "End Round" : "Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CardRevealOverlay;
