import "./PlayerReadyScreen.css";
import { useGame } from "./state/GameContext";

interface PlayerReadyScreenProps {
  player: "raptor" | "scientist";
}

function PlayerReadyScreen({ player }: PlayerReadyScreenProps) {
  const { dispatch } = useGame();

  const isScientist = player === "scientist";
  const otherPlayer = isScientist ? "Raptor" : "Scientist";
  const currentPlayer = isScientist ? "Scientist" : "Raptor";
  const emoji = isScientist ? "🔬" : "🦖";

  const handleReady = () => {
    dispatch({ type: "PLAYER_READY", player });
  };

  return (
    <div className={`PlayerReadyScreen ${player}`}>
      <div className="ready-content">
        <div className="ready-emoji">{emoji}</div>
        <h2 className="ready-title">{currentPlayer} Player</h2>
        <p className="ready-subtitle">Card Selection Phase</p>
        <p className="ready-warning">{otherPlayer} player must look away from the screen!</p>
        <button className="ready-button" onClick={handleReady}>
          I'm Ready
        </button>
      </div>
    </div>
  );
}

export default PlayerReadyScreen;
