import { useState } from "react";
import { useGame } from "./state/GameContext";
import { hasSavedGame, loadGame } from "./utils/saveLoad";
import Tutorial from "./Tutorial/Tutorial";

function MainMenu() {
  const { dispatch } = useGame();
  const [showTutorial, setShowTutorial] = useState(false);

  const handleNewGame = () => {
    dispatch({ type: "ADVANCE_PHASE" });
  };

  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  const savedGameExists = hasSavedGame();

  if (showTutorial) {
    return <Tutorial onClose={() => setShowTutorial(false)} />;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[linear-gradient(135deg,#1a1a2e_0%,#16213e_50%,#0f3460_100%)]">
      <div className="p-12 text-center">
        <h1 className="mb-2 font-['Bungee'] text-[5rem] text-white [text-shadow:0_4px_8px_rgba(0,0,0,0.3)]">Raptor</h1>
        <p className="mb-12 text-[1.2rem] text-white/60">An asymmetrical game of tactics and trickery for 2 players</p>
        <div className="flex flex-col items-center gap-4">
          <button
            className="min-w-50 rounded-lg bg-[linear-gradient(145deg,#4a8a4a,#2a6a2a)] px-12 py-4 text-[1.2rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95"
            onClick={handleNewGame}
          >
            New Game
          </button>
          {savedGameExists && (
            <button
              className="min-w-50 rounded-lg bg-[linear-gradient(145deg,#4a6a8a,#2a4a6a)] px-12 py-4 text-[1.2rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95"
              onClick={handleLoadGame}
            >
              Continue
            </button>
          )}
          <button
            className="min-w-50 rounded-lg bg-[linear-gradient(145deg,#6a4a8a,#4a2a6a)] px-12 py-4 text-[1.2rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95"
            onClick={() => setShowTutorial(true)}
          >
            How to Play
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
