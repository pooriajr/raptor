import { useGame } from "./state/GameContext";
import { getCardEffect } from "./utils/cardEffects";
import "./EffectPhaseOverlay.css";

type EffectType =
  | "fear"
  | "sleeping_gas"
  | "mothers_call"
  | "reinforcements"
  | "fire"
  | "none";

interface EffectPhaseBannerProps {
  selectedTargets: string[];
  effectLimit: number;
  effectType: EffectType;
  selectedBabyForCall: string | null;
  pendingMothersCallCount: number;
  pendingReinforcementCount: number;
  pendingFireCount: number;
  onConfirm: () => void;
  onSkip: () => void;
  onFireReset: () => void;
}

function EffectPhaseBanner({
  selectedTargets,
  effectLimit,
  effectType,
  selectedBabyForCall,
  pendingMothersCallCount,
  pendingReinforcementCount,
  pendingFireCount,
  onConfirm,
  onSkip,
  onFireReset,
}: EffectPhaseBannerProps) {
  const { state } = useGame();

  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;

  if (scientistCard === null || raptorCard === null) return null;

  const raptorHasEffect = raptorCard < scientistCard;
  const activePlayer = raptorHasEffect ? "raptor" : "scientist";
  const effectCard = raptorHasEffect ? raptorCard : scientistCard;

  const selectionCount = selectedTargets.length;

  // Determine instruction based on effect type
  const getInstruction = () => {
    if (effectType === "fear") {
      return `Click scientists to frighten (${selectionCount}/${effectLimit})`;
    } else if (effectType === "sleeping_gas") {
      return `Click baby raptors to put to sleep (${selectionCount}/${effectLimit})`;
    } else if (effectType === "mothers_call") {
      if (selectedBabyForCall !== null) {
        return `Click a destination space on mother's tile (${pendingMothersCallCount}/${effectLimit})`;
      } else {
        return `Click a baby raptor to call to mother's tile (${pendingMothersCallCount}/${effectLimit})`;
      }
    } else if (effectType === "reinforcements") {
      return `Click spaces on outer edges to place scientists (${pendingReinforcementCount}/${effectLimit})`;
    } else if (effectType === "fire") {
      return `Click spaces adjacent to scientists or fire (${pendingFireCount}/${effectLimit})`;
    }
    return "No effect";
  };

  // Determine if confirm button should be enabled
  const hasSelections = (() => {
    if (effectType === "mothers_call") return pendingMothersCallCount > 0;
    if (effectType === "reinforcements") return pendingReinforcementCount > 0;
    if (effectType === "fire") return pendingFireCount > 0;
    return selectionCount > 0;
  })();

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
          {effectType === "fire" && pendingFireCount > 0 && (
            <button className="reset-button" onClick={onFireReset}>
              Reset
            </button>
          )}
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
