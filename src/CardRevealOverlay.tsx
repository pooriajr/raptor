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

  // Trigger the flip animation after a short delay
  useEffect(() => {
    const timeout = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  const sameCards = scientistCard === raptorCard;
  const difference = Math.abs(scientistCard - raptorCard);
  const scientistWins = scientistCard < raptorCard;

  return (
    <div className="CardRevealOverlay">
      <div className="reveal-content">
        <h2 className="reveal-title">Card Reveal</h2>

        <div className="cards-comparison">
          {/* Scientist card */}
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

          {/* Raptor card */}
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
                  <div
                    className={`effect-box ${scientistWins ? "winner" : "loser"}`}
                  >
                    <div className="effect-player">Scientist</div>
                    {scientistWins ? (
                      <div className="effect-text">
                        Uses card effect:{" "}
                        {getCardEffect("scientist", scientistCard)}
                      </div>
                    ) : (
                      <div className="effect-text">
                        Gets {difference} action point
                        {difference > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  <div
                    className={`effect-box ${!scientistWins ? "winner" : "loser"}`}
                  >
                    <div className="effect-player">Raptor</div>
                    {!scientistWins ? (
                      <div className="effect-text">
                        Uses card effect: {getCardEffect("raptor", raptorCard)}
                      </div>
                    ) : (
                      <div className="effect-text">
                        Gets {difference} action point
                        {difference > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="turn-order">
                  {scientistWins ? "Scientist" : "Raptor"} acts first
                </div>
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
