import { useGame } from "./state/GameContext";
import "./Trackers.css";

function TrackerPips({ emoji, current, max }: { emoji: string; current: number; max: number }) {
  return (
    <span className="tracker-pips">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`tracker-pip ${i < current ? "filled" : "empty"}`}>
          {emoji}
        </span>
      ))}
    </span>
  );
}

function Trackers() {
  const { state } = useGame();

  return (
    <div className="Trackers">
      <div className="tracker-section raptor">
        <div className="tracker-header">Raptor</div>
        <div className="tracker-row">
          <span className="tracker-label">Escaped</span>
          <TrackerPips emoji="🦎" current={state.escapedBabies ?? 0} max={3} />
        </div>
        <div className="tracker-row">
          <span className="tracker-label">Sleep Tokens</span>
          <TrackerPips emoji="💤" current={state.motherSleepTokens ?? 0} max={5} />
        </div>
      </div>

      <div className="tracker-section scientist">
        <div className="tracker-header">Scientist</div>
        <div className="tracker-row">
          <span className="tracker-label">Captured</span>
          <TrackerPips emoji="🦎" current={state.capturedBabies ?? 0} max={3} />
        </div>
      </div>
    </div>
  );
}

export default Trackers;
