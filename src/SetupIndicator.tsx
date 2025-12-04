import { useGame } from "./state/GameContext.tsx";
import "./SetupIndicator.css";

function SetupIndicator() {
  const { state } = useGame();

  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") {
    return null;
  }

  const isRaptorSetup = state.phase === "RAPTOR_SETUP";
  const motherPlaced = state.pieces.some((p) => p.type === "mother");
  const babiesPlaced = state.pieces.filter((p) => p.type === "baby").length;
  const scientistsPlaced = state.pieces.filter((p) => p.type === "scientist").length;

  return (
    <div className={`SetupIndicator ${isRaptorSetup ? "raptor" : "scientist"}`}>
      <h2>{isRaptorSetup ? "Raptor Setup" : "Scientist Setup"}</h2>
      {isRaptorSetup ? (
        <div className="instructions">
          <p>Place your pieces on the board:</p>
          <ul>
            <li className={motherPlaced ? "done" : ""}>
              Mother raptor on a central tile (2 or 7) {motherPlaced ? "(placed)" : "(1 remaining)"}
            </li>
            <li className={babiesPlaced === 5 ? "done" : ""}>
              Baby raptors on other square tiles ({5 - babiesPlaced} remaining)
            </li>
          </ul>
          <p className="hint">One raptor per tile. Babies cannot go on the tile with the mother.</p>
        </div>
      ) : (
        <div className="instructions">
          <p>Place your scientists on the board:</p>
          <ul>
            <li className={scientistsPlaced === 4 ? "done" : ""}>
              One scientist per L-shaped tile ({4 - scientistsPlaced} remaining)
            </li>
          </ul>
          <p className="hint">Remaining scientists ({10 - scientistsPlaced}) stay in reserve.</p>
        </div>
      )}
    </div>
  );
}

export default SetupIndicator;
