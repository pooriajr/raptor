import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import "./CardResolution.css";

function CardResolution() {
  const { state } = useGame();

  const { activeEffectCard, actionPoints, effectActionsRemaining } = state;

  // Show resolution when we have an active effect card or action points
  const showResolution = activeEffectCard !== null || actionPoints > 0;

  let raptorContent = null;
  let scientistContent = null;
  let raptorActive = false;
  let scientistActive = false;
  let raptorDone = false;
  let scientistDone = false;

  const isRoundEnd = state.phase === "ROUND_END";

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
        // Raptor has effect, scientist has action points
        // MOTHER_RETURN is part of raptor's turn (after effect phase)
        raptorActive = state.phase === "EFFECT_PHASE" || state.phase === "MOTHER_RETURN";
        scientistActive = state.phase === "ACTION_PHASE";
        // Effect phase is done when we're in action phase or later
        raptorDone = state.phase === "ACTION_PHASE" || isRoundEnd;
        scientistDone = isRoundEnd;
      } else {
        scientistContent = effectContent;
        raptorContent = apContent;
        // Scientist has effect, raptor has action points
        scientistActive = state.phase === "EFFECT_PHASE";
        raptorActive = state.phase === "ACTION_PHASE" || state.phase === "MOTHER_RETURN";
        // Effect phase is done when we're in action phase or later
        scientistDone = state.phase === "ACTION_PHASE" || state.phase === "MOTHER_RETURN" || isRoundEnd;
        raptorDone = isRoundEnd;
      }
    } else {
      // Tied - no effect card, no action points displayed
      raptorContent = <span className="tied">Tied</span>;
      scientistContent = <span className="tied">Tied</span>;
    }
  }

  const raptorClassName = `half raptor${raptorActive ? " active" : ""}${raptorDone ? " done" : ""}`;
  const scientistClassName = `half scientist${scientistActive ? " active" : ""}${scientistDone ? " done" : ""}`;

  return (
    <div className="CardResolution">
      <div className={raptorClassName}>{raptorContent}</div>
      <div className="divider" />
      <div className={scientistClassName}>{scientistContent}</div>
    </div>
  );
}

export default CardResolution;
