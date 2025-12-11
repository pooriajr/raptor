import "./GameOverScreen.css";
import { useGame } from "./state/GameContext";
import type { WinCondition } from "./types/gameState";

const winConditionMessages: Record<WinCondition, string> = {
  babies_escaped: "Three baby raptors have escaped!",
  scientists_eliminated: "All scientists have been eliminated!",
  mother_neutralized: "The mother raptor has been neutralized!",
  babies_captured: "Three baby raptors have been captured!",
};

function GameOverScreen() {
  const { state, dispatch } = useGame();

  const handleBackToMenu = () => {
    dispatch({ type: "RESET_GAME" });
  };

  const isRaptorWinner = state.winner === "raptor";
  const winnerClass = isRaptorWinner ? "raptor-wins" : "scientist-wins";
  const winnerLabel = isRaptorWinner ? "Raptor" : "Scientist";
  const message = state.winCondition ? winConditionMessages[state.winCondition] : "";

  return (
    <div className={`GameOverScreen ${winnerClass}`}>
      <div className="game-over-content">
        <div className="winner-icons">
          <span className="trophy-icon bounce">🏆</span>
          <span className="winner-icon bounce">{isRaptorWinner ? "🦖" : "🧑‍🔬"}</span>
        </div>
        <h1 className="winner-title">{winnerLabel} Wins!</h1>
        <p className="win-message">{message}</p>
        <button className="menu-button" onClick={handleBackToMenu}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;
