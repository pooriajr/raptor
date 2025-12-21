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
  const winnerClass = isRaptorWinner
    ? "bg-[linear-gradient(135deg,#2d1f1f_0%,#4a2525_50%,#5c3030_100%)]"
    : "bg-[linear-gradient(135deg,#1a1a2e_0%,#16213e_50%,#0f3460_100%)]";
  const winnerLabel = isRaptorWinner ? "Raptor" : "Scientist";
  const message = state.winCondition ? winConditionMessages[state.winCondition] : "";

  return (
    <div className={`fixed inset-0 z-100 flex items-center justify-center ${winnerClass}`}>
      <div className="p-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <span className="animate-[bounce_0.6s_ease-in-out_infinite_alternate] text-[5rem] [animation-delay:150ms]">
            🏆
          </span>
          <span className="animate-[bounce_0.6s_ease-in-out_infinite_alternate] text-[6rem]">
            {isRaptorWinner ? "🦖" : "🧑‍🔬"}
          </span>
        </div>
        <h1 className="mb-4 font-['Bungee'] text-[3.5rem] text-white [text-shadow:0_4px_8px_rgba(0,0,0,0.3)]">
          {winnerLabel} Wins!
        </h1>
        <p className="mb-12 text-[1.3rem] text-white/80">{message}</p>
        <button
          className="min-w-50 rounded-lg bg-[linear-gradient(145deg,#4a8a4a,#2a6a2a)] px-12 py-4 text-[1.2rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95"
          onClick={handleBackToMenu}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;
