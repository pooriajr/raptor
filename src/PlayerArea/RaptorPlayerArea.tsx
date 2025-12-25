import PlayerAreaBase from "./PlayerAreaBase";
import { useGame } from "../state/GameContext";
import { isMotherPlaced, countPlacedBabies } from "../utils/pieceUtils";
import { isPhase } from "../state/guards.ts";

function RaptorPlayerArea() {
  const { state } = useGame();

  const setupInfo = (() => {
    if (isPhase(state, "RAPTOR_SETUP")) {
      return {
        phaseLabel: "Raptor Setup",
        progress: (
          <>
            <span>🦖 {isMotherPlaced(state) ? "1" : "0"}/1</span>
            <span>🦎 {countPlacedBabies(state)}/5</span>
          </>
        ),
        instruction: !isMotherPlaced(state)
          ? "Place mother on center tile"
          : countPlacedBabies(state) < 5
            ? "Place babies on square tiles"
            : "Setup complete!",
      };
    }
    if (isPhase(state, "MOTHER_RETURN")) {
      return {
        phaseLabel: "Mother Returns",
        progress: null,
        instruction:
          state.mother.position === null
            ? "Place mother on any empty space"
            : "Click another space to change, or Done to confirm",
      };
    }
    return null;
  })();

  return (
    <PlayerAreaBase
      player="raptor"
      cards={state.raptorCards}
      interaction={state.raptorInteraction}
      setupInfo={setupInfo}
      isSelectingCard={isPhase(state, "RAPTOR_CARD_SELECTION")}
      actionInstruction="Select a piece, then click to move or act"
    />
  );
}

export default RaptorPlayerArea;
