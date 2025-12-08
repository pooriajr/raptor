import { forwardRef } from "react";
import CardDeck from "./CardDeck";
import Hand from "./Hand";
import "./PlayerArea.css";

interface PlayerAreaProps {
  player: "raptor" | "scientist";
  // Deck
  deckCount: number;
  // Hand state
  handCards: number[];
  playedCard: number | null;
  selectedCard: number | null;
  floatingCard?: number | null;
  onCardSelect?: (value: number) => void;
  isNewDraw?: boolean;
  // Display modes
  showHand: boolean;
  handFaceDown?: boolean;
  hideUnselectedCards?: boolean;
  // Trackers
  escapedBabies?: number;
  capturedBabies?: number;
  motherSleepTokens?: number;
  // Action area
  actionInfo?: {
    phaseLabel: string;
    progress?: React.ReactNode;
    instruction: string;
  };
  actionButton?: {
    label: React.ReactNode;
    disabled: boolean;
    onClick: () => void;
    isDone?: boolean;
  };
}

const PlayerArea = forwardRef<HTMLDivElement, PlayerAreaProps>(function PlayerArea(
  {
    player,
    deckCount,
    handCards,
    playedCard,
    selectedCard,
    floatingCard,
    onCardSelect,
    isNewDraw = false,
    showHand,
    handFaceDown = false,
    hideUnselectedCards = false,
    escapedBabies,
    capturedBabies,
    motherSleepTokens,
    actionInfo,
    actionButton,
  },
  ref,
) {
  const isRaptor = player === "raptor";

  return (
    <div className={`player-area ${player}-area`} ref={ref}>
      <div className="player-area-left">
        <div className="deck-section">
          <CardDeck player={player} cardCount={deckCount} />
        </div>
        <div className="discard-section">
          <div className="discard-placeholder">Discard</div>
        </div>

        {isRaptor ? (
          <>
            <div className="baby-tracker-section">
              <div className="baby-tracker escaped">
                <span className="baby-tracker-label">Escaped:</span>
                <span className="baby-tracker-count">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className={`baby-pip ${i < (escapedBabies ?? 0) ? "filled" : "empty"}`}>
                      🦎
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <div className="sleep-tokens-section">
              <div className="sleep-tokens-display">
                <span className="sleep-tokens-label">Mother Sleep Tokens:</span>
                <span className="sleep-tokens-count">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`sleep-token-pip ${i < (motherSleepTokens ?? 0) ? "filled" : "empty"}`}>
                      💉
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="baby-tracker-section">
            <div className="baby-tracker captured">
              <span className="baby-tracker-label">Captured:</span>
              <span className="baby-tracker-count">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`baby-pip ${i < (capturedBabies ?? 0) ? "filled" : "empty"}`}>
                    🦎
                  </span>
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="player-area-center">
        <Hand
          cards={handCards}
          player={player}
          faceDown={handFaceDown}
          playedCard={playedCard}
          selectedCard={selectedCard}
          floatingCard={floatingCard}
          onCardSelect={showHand && !handFaceDown ? onCardSelect : undefined}
          isNewDraw={isNewDraw}
          deckPosition={{ x: -300, y: 0 }}
          hideUnselected={hideUnselectedCards}
          showPlaceholders={!showHand}
        />
      </div>

      <div className="player-area-action">
        {actionInfo && (
          <div className="action-info">
            <div className="action-phase-label">{actionInfo.phaseLabel}</div>
            {actionInfo.progress && <div className="action-progress">{actionInfo.progress}</div>}
            <div className="action-instruction">{actionInfo.instruction}</div>
          </div>
        )}
        {actionButton && (
          <button
            className={`end-turn-button ${actionButton.isDone ? "done" : ""}`}
            disabled={actionButton.disabled}
            onClick={actionButton.onClick}
          >
            {actionButton.label}
          </button>
        )}
      </div>
    </div>
  );
});

export default PlayerArea;
