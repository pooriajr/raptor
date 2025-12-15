import { useState } from "react";
import "./MainMenu.css";
import { useGame } from "./state/GameContext";
import { hasSavedGame, loadGame } from "./utils/saveLoad";
import Tutorial from "./Tutorial";

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
    <div className="MainMenu">
      <div className="menu-content">
        <h1 className="menu-title">Raptor</h1>
        <p className="menu-subtitle">An asymmetrical game of tactics and trickery for 2 players</p>
        <div className="menu-buttons">
          <button className="menu-button new-game" onClick={handleNewGame}>
            New Game
          </button>
          {savedGameExists && (
            <button className="menu-button load-game" onClick={handleLoadGame}>
              Continue
            </button>
          )}
          <button className="menu-button how-to-play" onClick={() => setShowTutorial(true)}>
            How to Play
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
