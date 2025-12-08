import "./SetupPanel.css";
import { useGame } from "./state/GameContext.tsx";

function SetupPanel() {
  const { state, dispatch } = useGame();

  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") {
    return null;
  }

  const isRaptorSetup = state.phase === "RAPTOR_SETUP";
  const motherPlaced = state.mother !== null;
  const babiesPlaced = state.babies.length;
  const scientistsPlaced = state.scientists.length;

  return (
    <div className={`SetupPanel ${isRaptorSetup ? "raptor" : "scientist"}`}>
      <h2>{isRaptorSetup ? "Raptor Setup" : "Scientist Setup"}</h2>

      {isRaptorSetup ? (
        <>
          <div className="instructions">
            <p>Click on the board to place pieces:</p>
            <ul>
              <li className={motherPlaced ? "done" : ""}>
                Mother on a central tile {motherPlaced ? "(placed)" : "(click center tiles)"}
              </li>
              <li className={babiesPlaced === 5 ? "done" : ""}>Babies on other tiles ({5 - babiesPlaced} remaining)</li>
            </ul>
          </div>
          <div className="piece-counts">
            {!motherPlaced && (
              <div className="piece-count mother-count">
                <span className="piece-icon">🦖</span>
                <span className="count-label">Mother to place</span>
              </div>
            )}
            {babiesPlaced < 5 && motherPlaced && (
              <div className="piece-count baby-count">
                <span className="piece-icon">🦎</span>
                <span className="count-label">× {5 - babiesPlaced} babies to place</span>
              </div>
            )}
          </div>
          <p className="hint">
            {!motherPlaced
              ? "Click any space on a highlighted center tile to place the mother."
              : "Click any space on a highlighted tile to place a baby. Click a placed piece to remove it."}
          </p>
        </>
      ) : (
        <>
          <div className="instructions">
            <p>Click on L-shaped tiles to place scientists:</p>
            <ul>
              <li className={scientistsPlaced === 4 ? "done" : ""}>
                One per L-shaped tile ({4 - scientistsPlaced} remaining)
              </li>
            </ul>
          </div>
          {scientistsPlaced < 4 ? (
            <>
              <div className="piece-counts">
                <div className="piece-count scientist-count">
                  <span className="piece-icon">🧑‍🔬</span>
                  <span className="count-label">× {4 - scientistsPlaced} scientists to place</span>
                </div>
              </div>
              <p className="hint">Click any space on a highlighted L-tile. Click a placed scientist to remove it.</p>
            </>
          ) : (
            <button className="start-button" onClick={() => dispatch({ type: "START_GAME" })}>
              Start Game
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default SetupPanel;
