import { useState, useEffect } from "react";
import Card from "./Card";
import { getCardEffect } from "./utils/cardEffects";
import "./CardRevealOverlay.css";

interface CardRevealOverlayProps {
  scientistCard: number;
  raptorCard: number;
  onConfirm: () => void;
}

function CardRevealOverlay({
  scientistCard,
  raptorCard,
  onConfirm,
}: CardRevealOverlayProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  const sameCards = scientistCard === raptorCard;
  const difference = Math.abs(scientistCard - raptorCard);
  const scientistWins = scientistCard < raptorCard;
  const winner = scientistWins ? "Scientist" : "Raptor";
  const actionPoints = `${difference} action point${difference > 1 ? "s" : ""}`;

  const renderEffectBox = (
    player: "scientist" | "raptor",
    card: number,
    isWinner: boolean,
  ) => (
    <div className={`effect-box ${isWinner ? "winner" : "loser"}`}>
      <div className="effect-player">
        {player === "scientist" ? "Scientist" : "Raptor"}
      </div>
      <div className="effect-text">
        {isWinner
          ? `Uses card effect: ${getCardEffect(player, card)}`
          : `Gets ${actionPoints}`}
      </div>
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
              <Card
                value={scientistCard}
                player="scientist"
                faceUp={revealed}
              />
            </div>
          </div>

          <div className="vs-divider">VS</div>

          <div className="reveal-card-section">
            <div className="player-label raptor">Raptor</div>
            <div className="reveal-card-wrapper">
              <Card value={raptorCard} player="raptor" faceUp={revealed} />
            </div>
          </div>
        </div>

        {revealed && (
          <>
            {sameCards ? (
              <div className="result-section same-cards">
                <div className="result-title">Same Cards!</div>
                <div className="result-description">
                  Nothing happens this round.
                </div>
              </div>
            ) : (
              <div className="result-section">
                <div className="effect-row">
                  {renderEffectBox("scientist", scientistCard, scientistWins)}
                  {renderEffectBox("raptor", raptorCard, !scientistWins)}
                </div>
                <div className="turn-order">{winner} acts first</div>
              </div>
            )}

            <button className="confirm-button" onClick={onConfirm}>
              {sameCards ? "End Round" : "Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CardRevealOverlay;
