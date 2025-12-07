import { useGame } from "./state/GameContext";
import "./ActionPhaseBanner.css";

interface ActionPhaseBannerProps {
  onEndTurn: () => void;
}

function ActionPhaseBanner({ onEndTurn }: ActionPhaseBannerProps) {
  const { state } = useGame();

  if (state.phase !== "ACTION_PHASE" || state.activePlayer === null) {
    return null;
  }

  const { activePlayer, actionPoints } = state;

  const getInstruction = () => {
    if (actionPoints === 0) {
      return "No action points remaining";
    }
    if (activePlayer === "raptor") {
      return "Drag babies to move them (1 AP each)";
    } else {
      return "Drag scientists to move them (1 AP each)";
    }
  };

  return (
    <div className={`ActionPhaseBanner ${activePlayer}`}>
      <div className="banner-content">
        <div className="banner-left">
          <span className="action-points-value">{actionPoints}</span>
          <span className="action-points-label">AP</span>
        </div>
        <div className="banner-center">
          <span className="banner-player">
            {activePlayer === "raptor" ? "Raptor" : "Scientist"} Action Phase
          </span>
          <span className="banner-instruction">{getInstruction()}</span>
        </div>
        <div className="banner-buttons">
          <button className="end-turn-button" onClick={onEndTurn}>
            End Turn
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionPhaseBanner;
