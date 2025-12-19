import { useState } from "react";
import Board from "./Board.tsx";
import { RaptorPlayerArea, ScientistPlayerArea, UndoButton } from "./PlayerArea";
import CardResolution from "./CardResolution.tsx";
import CardReveal from "./CardReveal.tsx";
import MainMenu from "./MainMenu.tsx";
import GameOverScreen from "./GameOverScreen.tsx";
import Trackers from "./Trackers.tsx";
import Tutorial from "./Tutorial/Tutorial.tsx";
import { useGame } from "./state/GameContext.tsx";
import "./GameLayout.css";

function GameLayout() {
  const { state } = useGame();
  const [showTutorial, setShowTutorial] = useState(false);

  const layoutClassName = `game-layout${state.activePlayer ? ` active-${state.activePlayer}` : ""}`;

  return (
    <div className={layoutClassName}>
      <RaptorPlayerArea />
      <div className="middle-row">
        <div className="side-column left">
          <Trackers />
          <button className="help-button" onClick={() => setShowTutorial(true)} title="How to Play">
            ?
          </button>
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
      {state.phase === "CARD_REVEAL" && <CardReveal />}
      {state.phase === "GAME_OVER" && <GameOverScreen />}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

export default GameLayout;
