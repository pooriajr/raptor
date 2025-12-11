import PlayerAreaBase from "./PlayerAreaBase";
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

  return (
    <PlayerAreaBase
      player="scientist"
      cards={state.scientistCards}
      interaction={state.scientistInteraction}
      setupInfo={setupInfo}
      isSelectingCard={state.phase === "SCIENTIST_CARD_SELECTION"}
      actionInstruction="Select a scientist, then click to move or act"
    />
  );
}

export default ScientistPlayerArea;
