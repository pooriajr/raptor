import { useGame } from "./state/GameContext.tsx";
import "./CardResolution.css";

function CardResolution() {
  const { state } = useGame();

  const { activeEffectCard, actionPoints } = state;

  // Show resolution when we have an active effect card or action points
  const showResolution = activeEffectCard !== null || actionPoints > 0;

  let raptorContent = null;
  let scientistContent = null;
  let raptorActive = false;
  let scientistActive = false;

  if (showResolution) {
    if (activeEffectCard) {
      // Someone gets the effect, other gets action points
      const effectContent = (
        <div className="effect">
          <span className="icon">{activeEffectCard.icon}</span>
          <span className="label">{activeEffectCard.name}</span>
        </div>
      );
      const apContent = (
        <div className="action-points">
          <span className="number">{actionPoints}</span>
          <span className="label">AP</span>
        </div>
      );

      if (activeEffectCard.player === "raptor") {
        raptorContent = effectContent;
        scientistContent = apContent;
        // Raptor has effect, scientist has action points
        raptorActive = state.phase === "EFFECT_PHASE";
        scientistActive = state.phase === "ACTION_PHASE";
      } else {
        scientistContent = effectContent;
        raptorContent = apContent;
        // Scientist has effect, raptor has action points
        scientistActive = state.phase === "EFFECT_PHASE";
        raptorActive = state.phase === "ACTION_PHASE";
      }
    } else {
      // Tied - no effect card, no action points displayed
      raptorContent = <span className="tied">Tied</span>;
      scientistContent = <span className="tied">Tied</span>;
    }
  }

  return (
    <div className="CardResolution">
      <div className={`half raptor${raptorActive ? " active" : ""}`}>{raptorContent}</div>
      <div className="divider" />
      <div className={`half scientist${scientistActive ? " active" : ""}`}>{scientistContent}</div>
    </div>
  );
}

export default CardResolution;
