import { useState } from "react";
import "./DevPanel.css";
import { useGame } from "./state/GameContext.tsx";

interface DevPanelProps {
  showCoordinates: boolean;
  onToggleCoordinates: (show: boolean) => void;
}

function DevPanel({ showCoordinates, onToggleCoordinates }: DevPanelProps) {
  const { state, dispatch } = useGame();
  const [collapsed, setCollapsed] = useState(false);

  const handleAutoSetup = () => {
    if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") {
      return;
    }

    const squareTiles = state.tiles.filter((t) => t.shape === "square");
    const lTiles = state.tiles.filter((t) => t.shape === "L");

    // Place mother on tile 2 if not placed
    if (state.phase === "RAPTOR_SETUP" && state.holdingPen.mother > 0) {
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
      let babiesPlaced = state.pieces.filter((p) => p.type === "baby").length;

      for (const tile of tilesForBabies) {
        if (babiesPlaced >= 5) break;
        const hasRaptor = state.pieces.some(
          (p) =>
            (p.type === "mother" || p.type === "baby") && p.tileId === tile.id,
        );
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
      let scientistsPlaced = state.pieces.filter(
        (p) => p.type === "scientist",
      ).length;

      for (const tile of lTiles) {
        if (scientistsPlaced >= 4) break;
        const hasScientist = state.pieces.some(
          (p) => p.type === "scientist" && p.tileId === tile.id,
        );
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

  const isSetupPhase =
    state.phase === "RAPTOR_SETUP" || state.phase === "SCIENTIST_SETUP";

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

      <div className="section">
        <label>
          <input
            type="checkbox"
            checked={showCoordinates}
            onChange={(e) => onToggleCoordinates(e.target.checked)}
          />
          Show coordinates
        </label>
      </div>

      {isSetupPhase && (
        <div className="section">
          <button className="auto-setup-btn" onClick={handleAutoSetup}>
            Auto Setup
          </button>
        </div>
      )}

      <div className="section">
        <div className="skip-buttons">
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 1,
                scientistCard: 5,
              });
            }}
          >
            Mother's Call (1)
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 4,
                scientistCard: 5,
              });
            }}
          >
            Mother's Call (2)
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 3,
                scientistCard: 5,
              });
            }}
          >
            Fear (1)
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 5,
                scientistCard: 1,
              });
            }}
          >
            Sleep Gas (1)
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 5,
                scientistCard: 2,
              });
            }}
          >
            Reinforcements
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 9,
                scientistCard: 5,
              });
            }}
          >
            Fire (2)
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 9,
                scientistCard: 7,
              });
            }}
          >
            Fire (3)
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 9,
                scientistCard: 3,
              });
            }}
          >
            Jeep (2)
          </button>
          <button
            className="skip-btn"
            onClick={() => {
              dispatch({
                type: "DEV_SKIP_TO_EFFECT",
                raptorCard: 9,
                scientistCard: 8,
              });
            }}
          >
            Jeep (4)
          </button>
        </div>
      </div>
    </div>
  );
}

export default DevPanel;
