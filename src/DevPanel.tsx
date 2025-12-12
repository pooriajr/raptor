import { useState } from "react";
import "./DevPanel.css";
import { useGame } from "./state/GameContext.tsx";
import { isMotherPlaced, countPlacedBabies, countPlacedScientists } from "./utils/pieceUtils.ts";

function DevPanel() {
  const { state, dispatch } = useGame();
  const [collapsed, setCollapsed] = useState(true);

  const handleAutoSetup = () => {
    if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") {
      return;
    }

    const squareTiles = state.tiles.filter((t) => t.shape === "square");
    const lTiles = state.tiles.filter((t) => t.shape === "L");

    // Place mother on tile 2 if not placed
    if (state.phase === "RAPTOR_SETUP" && !isMotherPlaced(state)) {
      const tile2 = squareTiles.find((t) => t.id === 2)!;
      const space = tile2.spaces.find((s) => !s.hasMountain)!;
      dispatch({
        type: "PLACE_MOTHER",
        tileId: 2,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }

    // Place babies on remaining square tiles
    if (state.phase === "RAPTOR_SETUP") {
      const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
      let babiesPlaced = countPlacedBabies(state);

      for (const tile of tilesForBabies) {
        if (babiesPlaced >= 5) break;
        const hasRaptor =
          state.mother.position?.tileId === tile.id ||
          Object.values(state.babies).some((b) => b.position?.tileId === tile.id);
        if (hasRaptor) continue;

        const space = tile.spaces.find((s) => !s.hasMountain)!;
        dispatch({
          type: "PLACE_BABY",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
        babiesPlaced++;
      }
    }

    // Place scientists on L-tiles
    if (state.phase === "SCIENTIST_SETUP") {
      let scientistsPlaced = countPlacedScientists(state);

      for (const tile of lTiles) {
        if (scientistsPlaced >= 4) break;
        const hasScientist = Object.values(state.scientists).some((s) => s.position?.tileId === tile.id);
        if (hasScientist) continue;

        const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        dispatch({
          type: "PLACE_SCIENTIST",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
        scientistsPlaced++;
      }
    }
  };

  if (collapsed) {
    return (
      <div className="DevPanel collapsed" onClick={() => setCollapsed(false)}>
        Dev
      </div>
    );
  }

  const isSetupPhase = state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP";

  return (
    <div className="DevPanel">
      <div className="header">
        <span>Dev Panel</span>
        <button className="collapse-btn" onClick={() => setCollapsed(true)}>
          -
        </button>
      </div>

      <div className="section">
        <label>Phase:</label>
        <span className="value">{state.phase}</span>
      </div>

      {isSetupPhase && (
        <div className="section">
          <button className="auto-setup-btn" onClick={handleAutoSetup}>
            Auto Setup
          </button>
        </div>
      )}

      <div className="section">
        <div className="section-label">Card Selection</div>
        <div className="skip-buttons">
          <button
            className="skip-btn card-btn"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_CARD_SELECTION", player: "scientist" })}
          >
            Scientist Cards
          </button>
          <button
            className="skip-btn card-btn"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_CARD_SELECTION", player: "raptor" })}
          >
            Raptor Cards
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-label">Action Phase</div>
        <div className="skip-buttons">
          <button
            className="skip-btn action-btn"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_ACTION", player: "scientist" })}
          >
            Scientist Actions (8)
          </button>
          <button
            className="skip-btn action-btn"
            onClick={() => dispatch({ type: "DEV_SKIP_TO_ACTION", player: "raptor" })}
          >
            Raptor Actions (8)
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-label">Raptor Effects</div>
        <div className="skip-buttons">
          <button
            className="skip-btn raptor-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_1_mothers_call",
                scientistCard: "scientist_5_fire",
              })
            }
          >
            Mother's Call (1)
          </button>
          <button
            className="skip-btn raptor-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_4_mothers_call",
                scientistCard: "scientist_5_fire",
              })
            }
          >
            Mother's Call (2)
          </button>
          <button
            className="skip-btn raptor-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_2_disappearance",
                scientistCard: "scientist_5_fire",
              })
            }
          >
            Disappearance
          </button>
          <button
            className="skip-btn raptor-effect"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_3_fear", scientistCard: "scientist_5_fire" })
            }
          >
            Fear (1)
          </button>
          <button
            className="skip-btn raptor-effect"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_8_fear", scientistCard: "scientist_9_none" })
            }
          >
            Fear (2)
          </button>
          <button
            className="skip-btn raptor-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_5_recovery",
                scientistCard: "scientist_9_none",
              })
            }
          >
            Recovery (2)
          </button>
          <button
            className="skip-btn raptor-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_7_recovery",
                scientistCard: "scientist_9_none",
              })
            }
          >
            Recovery (3)
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-label">Scientist Effects</div>
        <div className="skip-buttons">
          <button
            className="skip-btn scientist-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_5_recovery",
                scientistCard: "scientist_1_sleeping_gas",
              })
            }
          >
            Sleep Gas (1)
          </button>
          <button
            className="skip-btn scientist-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_9_none",
                scientistCard: "scientist_4_sleeping_gas",
              })
            }
          >
            Sleep Gas (2)
          </button>
          <button
            className="skip-btn scientist-effect"
            onClick={() =>
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: "raptor_5_recovery",
                scientistCard: "scientist_2_reinforcements",
              })
            }
          >
            Reinforcements
          </button>
          <button
            className="skip-btn scientist-effect"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_5_fire" })
            }
          >
            Fire (2)
          </button>
          <button
            className="skip-btn scientist-effect"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_7_fire" })
            }
          >
            Fire (3)
          </button>
          <button
            className="skip-btn scientist-effect"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_3_jeep" })
            }
          >
            Jeep (2)
          </button>
          <button
            className="skip-btn scientist-effect"
            onClick={() =>
              dispatch({ type: "DEV_SKIP_TO_EFFECT", raptorCard: "raptor_9_none", scientistCard: "scientist_8_jeep" })
            }
          >
            Jeep (4)
          </button>
        </div>
      </div>
    </div>
  );
}

export default DevPanel;
