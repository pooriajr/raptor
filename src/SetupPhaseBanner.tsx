import { useGame } from "./state/GameContext";
import "./SetupPhaseBanner.css";

interface SetupPhaseBannerProps {
  onConfirm: () => void;
}

function SetupPhaseBanner({ onConfirm }: SetupPhaseBannerProps) {
  const { state } = useGame();

  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") {
    return null;
  }

  const isRaptorSetup = state.phase === "RAPTOR_SETUP";
  const motherPlaced = state.mother !== null;
  const babiesPlaced = state.babies.length;
  const scientistsPlaced = state.scientists.length;

  const getInstruction = () => {
    if (isRaptorSetup) {
      if (!motherPlaced) {
        return "Click a space on a center tile (2 or 7) to place the mother";
      } else if (babiesPlaced < 5) {
        return `Place babies on square tiles (${babiesPlaced}/5) - click pieces to remove`;
      } else {
        return "Setup complete! Click Confirm to continue";
      }
    } else {
      if (scientistsPlaced < 4) {
        return `Place scientists on L-tiles (${scientistsPlaced}/4) - click pieces to remove`;
      } else {
        return "Setup complete! Click Confirm to start the game";
      }
    }
  };

  const getProgress = () => {
    if (isRaptorSetup) {
      const motherProgress = motherPlaced ? 1 : 0;
      return `Mother: ${motherProgress}/1, Babies: ${babiesPlaced}/5`;
    } else {
      return `Scientists: ${scientistsPlaced}/4`;
    }
  };

  const isComplete = isRaptorSetup
    ? motherPlaced && babiesPlaced === 5
    : scientistsPlaced === 4;

  return (
    <div className={`SetupPhaseBanner ${isRaptorSetup ? "raptor" : "scientist"}`}>
      <div className="banner-content">
        <div className="banner-left">
          <span className="setup-icon">{isRaptorSetup ? "🦖" : "🧑‍🔬"}</span>
          <span className="setup-progress">{getProgress()}</span>
        </div>
        <div className="banner-center">
          <span className="banner-player">{isRaptorSetup ? "Raptor" : "Scientist"} Setup</span>
          <span className="banner-instruction">{getInstruction()}</span>
        </div>
        <div className="banner-buttons">
          <button
            className={`confirm-button ${isComplete ? "active" : ""}`}
            onClick={onConfirm}
            disabled={!isComplete}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetupPhaseBanner;
