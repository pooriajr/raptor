import { useGame } from "./state/GameContext";
import { getCardEffect } from "./utils/cardEffects";
import "./EffectPhaseOverlay.css";

type EffectType = "fear" | "sleeping_gas" | "mothers_call" | "none";

interface EffectPhaseBannerProps {
  selectedTargets: string[];
  effectLimit: number;
  effectType: EffectType;
  selectedBabyForCall: string | null;
  onConfirm: () => void;
  onSkip: () => void;
}

function EffectPhaseBanner({
  selectedTargets,
  effectLimit,
  effectType,
  selectedBabyForCall,
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

  // Determine instruction based on effect type
  const getInstruction = () => {
    if (effectType === "fear") {
      return `Click scientists to frighten (${selectionCount}/${effectLimit})`;
    } else if (effectType === "sleeping_gas") {
      return `Click baby raptors to put to sleep (${selectionCount}/${effectLimit})`;
    } else if (effectType === "mothers_call") {
      if (selectedBabyForCall === null) {
        return `Click a baby raptor to call to mother's tile (0/${effectLimit})`;
      } else {
        return "Click a destination space on mother's tile";
      }
    }
    return "No effect";
  };

  // For Mother's Call, don't show confirm button - it's instant on destination click
  const showConfirmButton = effectType !== "mothers_call";

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
          <span className="banner-instruction">{getInstruction()}</span>
        </div>
        <div className="banner-buttons">
          <button className="skip-button" onClick={onSkip}>
            Skip
          </button>
          {showConfirmButton && (
            <button
              className={`confirm-button ${hasSelections ? "active" : ""}`}
              onClick={onConfirm}
              disabled={!hasSelections}
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EffectPhaseBanner;
