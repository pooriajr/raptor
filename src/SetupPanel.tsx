import "./SetupPanel.css";
import { useGame } from "./state/GameContext.tsx";
import type { PieceType } from "./types/gameState.ts";
import { getPieceEmoji } from "./utils/pieceUtils.ts";

interface SetupPanelProps {
  onDragStart: (pieceType: PieceType) => void;
  onDragEnd: () => void;
}

function SetupPanel({ onDragStart, onDragEnd }: SetupPanelProps) {
  const { state, dispatch } = useGame();

  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") {
    return null;
  }

  const isRaptorSetup = state.phase === "RAPTOR_SETUP";
  const motherPlaced = state.mother !== null;
  const babiesPlaced = state.babies.length;
  const scientistsPlaced = state.scientists.length;

  // Create arrays of draggable items based on holding pen counts
  const motherItems = Array(state.holdingPen.mother).fill(
    "mother" as PieceType,
  );
  const babyItems = Array(state.holdingPen.babies).fill("baby" as PieceType);
  const scientistItems = Array(state.holdingPen.scientists).fill(
    "scientist" as PieceType,
  );

  return (
    <div className={`SetupPanel ${isRaptorSetup ? "raptor" : "scientist"}`}>
      <h2>{isRaptorSetup ? "Raptor Setup" : "Scientist Setup"}</h2>

      {isRaptorSetup ? (
        <>
          <div className="instructions">
            <p>Place your pieces on the board:</p>
            <ul>
              <li className={motherPlaced ? "done" : ""}>
                Mother on a central tile {motherPlaced ? "(done)" : "(1)"}
              </li>
              <li className={babiesPlaced === 5 ? "done" : ""}>
                Babies on other square tiles ({5 - babiesPlaced} left)
              </li>
            </ul>
          </div>
          <div className="pieces">
            {motherItems.map((type, index) => (
              <span
                key={`mother-${index}`}
                className="piece"
                draggable
                onDragStart={() => onDragStart(type)}
                onDragEnd={onDragEnd}
              >
                {getPieceEmoji(type)}
              </span>
            ))}
            {babyItems.map((type, index) => (
              <span
                key={`baby-${index}`}
                className="piece"
                draggable
                onDragStart={() => onDragStart(type)}
                onDragEnd={onDragEnd}
              >
                {getPieceEmoji(type)}
              </span>
            ))}
          </div>
          <p className="hint">
            One raptor per tile. Babies cannot share a tile with the mother.
          </p>
        </>
      ) : (
        <>
          <div className="instructions">
            <p>Place your scientists on the board:</p>
            <ul>
              <li className={scientistsPlaced === 4 ? "done" : ""}>
                One per L-shaped tile ({4 - scientistsPlaced} left)
              </li>
            </ul>
          </div>
          {scientistsPlaced < 4 ? (
            <>
              <div className="pieces">
                {scientistItems
                  .slice(0, 4 - scientistsPlaced)
                  .map((type, index) => (
                    <span
                      key={`scientist-${index}`}
                      className="piece"
                      draggable
                      onDragStart={() => onDragStart(type)}
                      onDragEnd={onDragEnd}
                    >
                      {getPieceEmoji(type)}
                    </span>
                  ))}
              </div>
              <p className="hint">
                6 scientists will remain in reserve after setup.
              </p>
            </>
          ) : (
            <button
              className="start-button"
              onClick={() => dispatch({ type: "START_GAME" })}
            >
              Start Game
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default SetupPanel;
