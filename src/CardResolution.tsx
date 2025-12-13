import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import { useReveal } from "./revealContext.ts";
import "./CardResolution.css";

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
  let raptorActive = false;
  let scientistActive = false;
  let raptorDone = false;
  let scientistDone = false;

  if (showResolution) {
    if (activeEffectCard) {
      // Someone gets the effect, other gets action points
      const { effectCount, icon, name } = activeEffectCard;
      const usedCount = effectCount - effectActionsRemaining;

      const effectContent = (
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
      const apContent = (
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

      if (activeEffectCard.player === "raptor") {
        raptorContent = effectContent;
        scientistContent = apContent;
        raptorDone = state.activePlayer === "scientist" || isRoundEnd;
        scientistDone = isRoundEnd || state.phase === "MOTHER_RETURN";
      } else {
        scientistContent = effectContent;
        raptorContent = apContent;
        scientistDone = state.activePlayer === "raptor" || isRoundEnd;
        raptorDone = isRoundEnd;
      }
      raptorActive = state.activePlayer === "raptor";
      scientistActive = state.activePlayer === "scientist";
    } else {
      // Tied - no effect card, no action points displayed
      raptorContent = <span className="tied">Tied</span>;
      scientistContent = <span className="tied">Tied</span>;
    }
  }

  // During CARD_REVEAL, don't dim either side
  const raptorClassName = `half raptor${raptorActive ? " active" : ""}${!isCardReveal && raptorDone ? " done" : ""}`;
  const scientistClassName = `half scientist${scientistActive ? " active" : ""}${!isCardReveal && scientistDone ? " done" : ""}`;

  // During reveal, control which half is visible based on stage
  // Effect player's half shows first (show-effect), then AP player's half (show-ap)
  const raptorGetsEffect = effectPlayer === "raptor";
  const showRaptorHalf = isCardReveal ? (raptorGetsEffect ? isShowingEffect : isShowingAP) : true;
  const showScientistHalf = isCardReveal ? (raptorGetsEffect ? isShowingAP : isShowingEffect) : true;

  return (
    <div className="CardResolution">
      <motion.div
        className={raptorClassName}
        initial={isCardReveal ? { opacity: 0, scale: 0.8 } : false}
        animate={{ opacity: showRaptorHalf ? 1 : 0, scale: showRaptorHalf ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {raptorContent}
      </motion.div>
      <div className="divider" />
      <motion.div
        className={scientistClassName}
        initial={isCardReveal ? { opacity: 0, scale: 0.8 } : false}
        animate={{ opacity: showScientistHalf ? 1 : 0, scale: showScientistHalf ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {scientistContent}
      </motion.div>
    </div>
  );
}

export default CardResolution;
