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
import { isPhase } from "./state/guards.ts";

function GameLayout() {
  const { state } = useGame();
  const [showTutorial, setShowTutorial] = useState(false);

  const layoutClassName = [
    "game-layout group grid h-screen w-screen grid-cols-1 grid-rows-[auto_1fr_auto] overflow-hidden transition-colors duration-300",
    state.activePlayer === "raptor" ? "active-raptor bg-[#142514]" : "",
    state.activePlayer === "scientist" ? "active-scientist bg-[#3a240c]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClassName}>
      <RaptorPlayerArea />
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <Trackers />
          <button
            className="flex h-9 min-h-9 w-9 min-w-9 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-[1.2rem] leading-none font-bold text-white/60 transition-all duration-200 hover:border-white/50 hover:bg-white/20 hover:text-white"
            onClick={() => setShowTutorial(true)}
            title="How to Play"
          >
            ?
          </button>
        </div>
        <div className="flex items-center justify-center">
          <Board />
        </div>
        <div className="flex flex-col items-center justify-center gap-3">
          <UndoButton player="raptor" />
          <CardResolution />
          <UndoButton player="scientist" />
        </div>
      </div>
      <ScientistPlayerArea />
      {isPhase(state, "MAIN_MENU") && <MainMenu />}
      {isPhase(state, "CARD_REVEAL") && <CardReveal />}
      {isPhase(state, "GAME_OVER") && <GameOverScreen />}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

export default GameLayout;
