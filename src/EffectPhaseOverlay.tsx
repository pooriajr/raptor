import { useGame } from "./state/GameContext";
import { getCardEffect } from "./utils/cardEffects";
import "./EffectPhaseOverlay.css";

interface EffectPhaseBannerProps {
  selectedTargets: string[];
  effectLimit: number;
  onConfirm: () => void;
  onSkip: () => void;
}

function EffectPhaseBanner({
  selectedTargets,
  effectLimit,
  onConfirm,
  onSkip,
}: EffectPhaseBannerProps) {
  const { state } = useGame();

  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;

  if (scientistCard === null || raptorCard === null) return null;

  const raptorHasEffect = raptorCard < scientistCard;
  const activePlayer = raptorHasEffect ? "raptor" : "scientist";
  const effectCard = raptorHasEffect ? raptorCard : scientistCard;

  const hasSelections = selectedTargets.length > 0;
  const selectionCount = selectedTargets.length;

  return (
    <div className={`EffectPhaseBanner ${activePlayer}`}>
      <div className="banner-content">
        <div className="banner-left">
          <span className="effect-card-value">{effectCard}</span>
          <span className="effect-card-name">
            {getCardEffect(activePlayer, effectCard)}
          </span>
        </div>
        <div className="banner-center">
          <span className="banner-player">
            {activePlayer === "raptor" ? "Raptor" : "Scientist"}
          </span>
          <span className="banner-instruction">
            {raptorHasEffect
              ? `Click scientists to frighten (${selectionCount}/${effectLimit})`
              : `Click baby raptors to put to sleep (${selectionCount}/${effectLimit})`}
          </span>
        </div>
        <div className="banner-buttons">
          <button className="skip-button" onClick={onSkip}>
            Skip
          </button>
          <button
            className={`confirm-button ${hasSelections ? "active" : ""}`}
            onClick={onConfirm}
            disabled={!hasSelections}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default EffectPhaseBanner;
