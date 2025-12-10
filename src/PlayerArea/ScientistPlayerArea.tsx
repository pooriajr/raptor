import PlayerAreaBase from "./PlayerAreaBase";
import Tracker from "./Tracker";
import { useGame } from "../state/GameContext";
import { countPlacedScientists } from "../utils/pieceUtils";

function ScientistPlayerArea() {
  const { state } = useGame();

  const setupInfo =
    state.phase === "SCIENTIST_SETUP"
      ? {
          phaseLabel: "Scientist Setup",
          progress: <span>🧑‍🔬 {countPlacedScientists(state)}/4</span>,
          instruction: countPlacedScientists(state) < 4 ? "Place scientists on L-tiles" : "Setup complete!",
        }
      : null;

  const trackers = <Tracker label="Captured" emoji="🦎" current={state.capturedBabies ?? 0} max={3} />;

  return (
    <PlayerAreaBase
      player="scientist"
      trackers={trackers}
      setupInfo={setupInfo}
      actionInstruction="Select a scientist, then click to move or act"
    />
  );
}

export default ScientistPlayerArea;
