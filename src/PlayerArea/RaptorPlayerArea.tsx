import PlayerAreaBase from "./PlayerAreaBase";
import Tracker from "./Tracker";
import { useGame } from "../state/GameContext";
import { isMotherPlaced, countPlacedBabies } from "../utils/pieceUtils";

function RaptorPlayerArea() {
  const { state } = useGame();

  const setupInfo =
    state.phase === "RAPTOR_SETUP"
      ? {
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
        }
      : null;

  const trackers = (
    <>
      <Tracker label="Escaped" emoji="🦎" current={state.escapedBabies ?? 0} max={3} />
      <Tracker label="Mother Sleep Tokens" emoji="💉" current={state.motherSleepTokens ?? 0} max={5} />
    </>
  );

  return (
    <PlayerAreaBase
      player="raptor"
      cards={state.raptorCards}
      interaction={state.raptorInteraction}
      trackers={trackers}
      setupInfo={setupInfo}
      isSelectingCard={state.phase === "RAPTOR_CARD_SELECTION"}
      actionInstruction="Select a piece, then click to move or act"
    />
  );
}

export default RaptorPlayerArea;
