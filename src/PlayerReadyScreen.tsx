import "./PlayerReadyScreen.css";

interface PlayerReadyScreenProps {
  player: "raptor" | "scientist";
  onReady: () => void;
}

function PlayerReadyScreen({ player, onReady }: PlayerReadyScreenProps) {
  const isScientist = player === "scientist";
  const otherPlayer = isScientist ? "Raptor" : "Scientist";
  const currentPlayer = isScientist ? "Scientist" : "Raptor";
  const emoji = isScientist ? "🔬" : "🦖";

  return (
    <div className={`PlayerReadyScreen ${player}`}>
      <div className="ready-content">
        <div className="ready-emoji">{emoji}</div>
        <h2 className="ready-title">{currentPlayer} Player</h2>
        <p className="ready-subtitle">Card Selection Phase</p>
        <p className="ready-warning">
          {otherPlayer} player must look away from the screen!
        </p>
        <button className="ready-button" onClick={onReady}>
          I'm Ready
        </button>
      </div>
    </div>
  );
}

export default PlayerReadyScreen;
