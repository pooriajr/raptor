import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import { useReveal } from "./revealContext.ts";
import "./CardResolution.css";
import type { CardInfo } from "@/data/cards.ts";

type HalfState = "active" | "done" | "hidden" | "neutral";

interface CardResolutionDisplayProps {
  raptorContent: React.ReactNode;
  scientistContent: React.ReactNode;
  raptorState?: HalfState;
  scientistState?: HalfState;
  static?: boolean;
}

// Presentational component - renders the resolution display with no state management
export function CardResolutionDisplay({
  raptorContent,
  scientistContent,
  raptorState = "neutral",
  scientistState = "neutral",
  static: isStatic = false,
}: CardResolutionDisplayProps) {
  const raptorClassName = `half raptor${raptorState === "active" ? " active" : ""}${raptorState === "done" ? " done" : ""}`;
  const scientistClassName = `half scientist${scientistState === "active" ? " active" : ""}${scientistState === "done" ? " done" : ""}`;

  const showRaptorHalf = raptorState !== "hidden";
  const showScientistHalf = scientistState !== "hidden";

  if (isStatic) {
    return (
      <div className="CardResolution">
        {showRaptorHalf && <div className={raptorClassName}>{raptorContent}</div>}
        <div className="divider" />
        {showScientistHalf && <div className={scientistClassName}>{scientistContent}</div>}
      </div>
    );
  }

  return (
    <div className="CardResolution">
      <motion.div
        className={raptorClassName}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showRaptorHalf ? 1 : 0, scale: showRaptorHalf ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {raptorContent}
      </motion.div>
      <div className="divider" />
      <motion.div
        className={scientistClassName}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showScientistHalf ? 1 : 0, scale: showScientistHalf ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {scientistContent}
      </motion.div>
    </div>
  );
}

// Helper to build effect content from a card
export function EffectContent({ card, usedCount = 0 }: { card: CardInfo; usedCount?: number }) {
  const { effectCount, icon, name } = card;
  return (
    <div className="effect">
      <div className="effect-icons">
        {effectCount > 0 ? (
          Array.from({ length: effectCount }, (_, i) => (
            <span key={i} className={`icon${i < usedCount ? " used" : ""}`}>
              {icon}
            </span>
          ))
        ) : (
          <span className="icon">{icon}</span>
        )}
      </div>
      <span className="label">{name}</span>
    </div>
  );
}

// Helper to build action points content
export function ActionPointsContent({ actionPoints, animate = true }: { actionPoints: number; animate?: boolean }) {
  if (animate) {
    return (
      <div className="action-points">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={actionPoints}
            className="number"
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {actionPoints}
          </motion.span>
        </AnimatePresence>
        <span className="label">AP</span>
      </div>
    );
  }
  return (
    <div className="action-points">
      <span className="number">{actionPoints}</span>
      <span className="label">AP</span>
    </div>
  );
}

// Container component - manages state and passes to CardResolutionDisplay
function CardResolution() {
  const { state } = useGame();
  const { stage: revealStage, effectPlayer } = useReveal();

  const { activeEffectCard, actionPoints, effectActionsRemaining } = state;

  const isCardReveal = state.phase === "CARD_REVEAL";
  const isRoundEnd = state.phase === "ROUND_END";

  // During CARD_REVEAL, control visibility based on reveal stage
  const isShowingEffect = revealStage === "show-effect" || revealStage === "show-ap" || revealStage === "complete";
  const isShowingAP = revealStage === "show-ap" || revealStage === "complete";

  // Hide if there's no effect or action points to display
  if (!activeEffectCard && actionPoints === 0) {
    return null;
  }

  // During CARD_REVEAL, hide until reveal reaches the appropriate stage
  if (isCardReveal && !isShowingEffect) {
    return null;
  }

  // Show resolution when we have an active effect card or action points
  const showResolution = activeEffectCard !== null || actionPoints > 0;

  let raptorContent = null;
  let scientistContent = null;
  let raptorState: HalfState = "neutral";
  let scientistState: HalfState = "neutral";

  if (showResolution) {
    if (activeEffectCard) {
      // Someone gets the effect, other gets action points
      const usedCount = activeEffectCard.effectCount - effectActionsRemaining;

      const effectContent = <EffectContent card={activeEffectCard} usedCount={usedCount} />;
      const apContent = <ActionPointsContent actionPoints={actionPoints} />;

      if (activeEffectCard.player === "raptor") {
        raptorContent = effectContent;
        scientistContent = apContent;
        const raptorDone = state.activePlayer === "scientist" || isRoundEnd;
        const scientistDone = isRoundEnd || state.phase === "MOTHER_RETURN";
        if (state.activePlayer === "raptor") raptorState = "active";
        else if (!isCardReveal && raptorDone) raptorState = "done";
        if (state.activePlayer === "scientist") scientistState = "active";
        else if (!isCardReveal && scientistDone) scientistState = "done";
      } else {
        scientistContent = effectContent;
        raptorContent = apContent;
        const scientistDone = state.activePlayer === "raptor" || isRoundEnd;
        const raptorDone = isRoundEnd;
        if (state.activePlayer === "scientist") scientistState = "active";
        else if (!isCardReveal && scientistDone) scientistState = "done";
        if (state.activePlayer === "raptor") raptorState = "active";
        else if (!isCardReveal && raptorDone) raptorState = "done";
      }
    } else {
      // Tied - no effect card, no action points displayed
      raptorContent = <span className="tied">Tied</span>;
      scientistContent = <span className="tied">Tied</span>;
    }
  }

  // During reveal, control which half is visible based on stage
  // Effect player's half shows first (show-effect), then AP player's half (show-ap)
  if (isCardReveal) {
    const raptorGetsEffect = effectPlayer === "raptor";
    const showRaptorHalf = raptorGetsEffect ? isShowingEffect : isShowingAP;
    const showScientistHalf = raptorGetsEffect ? isShowingAP : isShowingEffect;
    if (!showRaptorHalf) raptorState = "hidden";
    if (!showScientistHalf) scientistState = "hidden";
  }

  return (
    <CardResolutionDisplay
      raptorContent={raptorContent}
      scientistContent={scientistContent}
      raptorState={raptorState}
      scientistState={scientistState}
    />
  );
}

export default CardResolution;
