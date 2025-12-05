import "./CardRevealOverlay.css";

interface CardRevealOverlayProps {
  scientistCard: number;
  raptorCard: number;
  onConfirm: () => void;
}

// Card effect descriptions based on card number
const SCIENTIST_EFFECTS: Record<number, string> = {
  1: "Sleeping Gas (1 baby)",
  2: "Reinforcements (1-2 scientists)",
  3: "Jeep (x2 movements)",
  4: "Sleeping Gas (x2)",
  5: "Fire (x2 tokens)",
  6: "Reinforcements (1-2 scientists)",
  7: "Fire (x3 tokens)",
  8: "Jeep (x4 movements)",
  9: "No effect",
};

const RAPTOR_EFFECTS: Record<number, string> = {
  1: "Mother's Call (1 baby)",
  2: "Disappearance + Observation",
  3: "Fear (frighten 1 scientist)",
  4: "Mother's Call (1-2 babies)",
  5: "Recovery (x2)",
  6: "Disappearance + Observation",
  7: "Recovery (x3)",
  8: "Fear (x2)",
  9: "No effect",
};

function CardRevealOverlay({
  scientistCard,
  raptorCard,
  onConfirm,
}: CardRevealOverlayProps) {
  const sameCards = scientistCard === raptorCard;
  const difference = Math.abs(scientistCard - raptorCard);
  const scientistWins = scientistCard < raptorCard;

  return (
    <div className="CardRevealOverlay">
      <div className="reveal-content">
        <h2 className="reveal-title">Card Reveal</h2>

        <div className="cards-comparison">
          {/* Scientist card */}
          <div className="reveal-card-section scientist">
            <div className="player-label">Scientist</div>
            <div className="reveal-card">
              <div className="card-value">{scientistCard}</div>
              <div className="card-icon">🔬</div>
            </div>
          </div>

          <div className="vs-divider">VS</div>

          {/* Raptor card */}
          <div className="reveal-card-section raptor">
            <div className="player-label">Raptor</div>
            <div className="reveal-card">
              <div className="card-value">{raptorCard}</div>
              <div className="card-icon">🦖</div>
            </div>
          </div>
        </div>

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
              <div className={`effect-box ${scientistWins ? "winner" : "loser"}`}>
                <div className="effect-player">Scientist</div>
                {scientistWins ? (
                  <div className="effect-text">
                    Uses card effect: {SCIENTIST_EFFECTS[scientistCard]}
                  </div>
                ) : (
                  <div className="effect-text">
                    Gets {difference} action point{difference > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className={`effect-box ${!scientistWins ? "winner" : "loser"}`}>
                <div className="effect-player">Raptor</div>
                {!scientistWins ? (
                  <div className="effect-text">
                    Uses card effect: {RAPTOR_EFFECTS[raptorCard]}
                  </div>
                ) : (
                  <div className="effect-text">
                    Gets {difference} action point{difference > 1 ? "s" : ""}
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
      </div>
    </div>
  );
}

export default CardRevealOverlay;
