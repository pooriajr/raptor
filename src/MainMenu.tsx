import "./MainMenu.css";
import { useGame } from "./state/GameContext";
import { hasSavedGame, loadGame } from "./utils/saveLoad";

function MainMenu() {
  const { dispatch } = useGame();

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

  return (
    <div className="MainMenu">
      <div className="menu-content">
        <h1 className="menu-title">Raptor</h1>
        <p className="menu-subtitle">A game of survival and capture</p>
        <div className="menu-buttons">
          <button className="menu-button new-game" onClick={handleNewGame}>
            New Game
          </button>
          {savedGameExists && (
            <button className="menu-button load-game" onClick={handleLoadGame}>
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
