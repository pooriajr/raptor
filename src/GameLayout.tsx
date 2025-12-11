import Board from "./Board.tsx";
import { RaptorPlayerArea, ScientistPlayerArea, UndoButton } from "./PlayerArea";
import CardResolution from "./CardResolution.tsx";
import CardRevealOverlay from "./CardRevealOverlay.tsx";
import PlayerReadyScreen from "./PlayerReadyScreen.tsx";
import MainMenu from "./MainMenu.tsx";
import Trackers from "./Trackers.tsx";
import { useGame } from "./state/GameContext.tsx";
import "./GameLayout.css";

function GameLayout() {
  const { state } = useGame();

  const layoutClassName = `game-layout${state.activePlayer ? ` active-${state.activePlayer}` : ""}`;

  return (
    <div className={layoutClassName}>
      <RaptorPlayerArea />
      <div className="middle-row">
        <div className="side-column left">
          <Trackers />
        </div>
        <div className="board-column">
          <Board />
        </div>
        <div className="side-column right">
          <UndoButton player="raptor" />
          <CardResolution />
          <UndoButton player="scientist" />
        </div>
      </div>
      <ScientistPlayerArea />
      {state.phase === "MAIN_MENU" && <MainMenu />}
      {state.phase === "CARD_REVEAL" && <CardRevealOverlay />}
      {state.phase === "SCIENTIST_READY" && <PlayerReadyScreen player="scientist" />}
      {state.phase === "RAPTOR_READY" && <PlayerReadyScreen player="raptor" />}
    </div>
  );
}

export default GameLayout;
