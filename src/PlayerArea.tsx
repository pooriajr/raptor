import { forwardRef } from "react";
import CardDeck from "./CardDeck";
import Hand from "./Hand";
import Card from "./Card";
import { useGame } from "./state/GameContext";
import "./PlayerArea.css";

interface PlayerAreaProps {
  player: "raptor" | "scientist";
  // Selection state (managed by Board for now)
  selectedCard: number | null;
  floatingCard?: number | null;
  onCardSelect?: (value: number) => void;
  isNewDraw?: boolean;
  // Action area (effect/action phase UI from Board)
  actionInfo?: {
    phaseLabel: string;
    progress?: React.ReactNode;
    instruction: string;
    actionPoints?: number; // For action phase - displayed prominently
  };
  actionButton?: {
    label: React.ReactNode;
    disabled: boolean;
    onClick: () => void;
    isDone?: boolean;
  };
  // Undo/Reset button (shown below action info)
  undoButton?: {
    onClick: () => void;
    label?: string; // Optional label, defaults to undo icon
  };
}

const PlayerArea = forwardRef<HTMLDivElement, PlayerAreaProps>(function PlayerArea(
  { player, selectedCard, floatingCard, onCardSelect, isNewDraw = false, actionInfo, actionButton, undoButton },
  ref,
) {
  const { state } = useGame();
  const isRaptor = player === "raptor";

  // Derive state from context
  const cards = isRaptor ? state.raptorCards : state.scientistCards;
  const deckCount = cards.deck.length;
  const handCards = cards.hand;
  const playedCard = cards.played;
  const discardPile = cards.discard;

  const escapedBabies = state.escapedBabies;
  const capturedBabies = state.capturedBabies;
  const motherSleepTokens = state.motherSleepTokens;

  // Compute display modes based on phase
  const isSetupPhase = state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP";
  const isReadyPhase = state.phase === "SCIENTIST_READY" || state.phase === "RAPTOR_READY";

  const isThisPlayerSelecting =
    (player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION");

  const isOpponentSelecting =
    (player === "scientist" && state.phase === "RAPTOR_CARD_SELECTION") ||
    (player === "raptor" && state.phase === "SCIENTIST_CARD_SELECTION");

  const isCardReveal = state.phase === "CARD_REVEAL";
  const isEffectPhase = state.phase === "EFFECT_PHASE";
  const isActionPhase = state.phase === "ACTION_PHASE";

  // Determine hand visibility and display mode
  const showHand = !isSetupPhase && !isReadyPhase;
  const handFaceDown = isOpponentSelecting;
  const faceDownUnselectedCards = isEffectPhase || isActionPhase || isCardReveal;

  return (
    <div className={`player-area ${player}-area`} ref={ref}>
      <div className="player-area-left">
        <div className="deck-section">
          <CardDeck player={player} cardCount={deckCount} />
        </div>
        <div className="discard-section">
          {discardPile.length > 0 ? (
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
          ) : (
            <div className="discard-placeholder">Discard</div>
          )}
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
          playedCard={isThisPlayerSelecting ? null : playedCard}
          selectedCard={isThisPlayerSelecting ? selectedCard : null}
          floatingCard={floatingCard}
          onCardSelect={showHand && !handFaceDown ? onCardSelect : undefined}
          isNewDraw={isNewDraw}
          deckPosition={{ x: -300, y: 0 }}
          faceDownUnselected={faceDownUnselectedCards}
          showPlaceholders={!showHand}
        />
      </div>

      <div className="player-area-action">
        {actionInfo && (
          <div className="action-info">
            {actionInfo.actionPoints !== undefined && (
              <div className="action-points-display">
                <span className="action-points-value">{actionInfo.actionPoints}</span>
                <span className="action-points-label">AP</span>
              </div>
            )}
            <div className="action-text">
              <div className="action-phase-label">{actionInfo.phaseLabel}</div>
              {actionInfo.progress && <div className="action-progress">{actionInfo.progress}</div>}
              <div className="action-instruction">{actionInfo.instruction}</div>
              {undoButton && (
                <button className="reset-button" onClick={undoButton.onClick} title={undoButton.label || "Undo"}>
                  {undoButton.label || "↩"}
                </button>
              )}
            </div>
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
