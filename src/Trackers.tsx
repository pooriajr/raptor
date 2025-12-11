import { motion } from "framer-motion";
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

function BabyTrackerPips({ babies, max }: { babies: { id: string }[]; max: number }) {
  return (
    <span className="tracker-pips">
      {Array.from({ length: max }).map((_, i) => {
        const baby = babies[i];
        const isFilled = baby !== undefined;

        return (
          <motion.span
            key={baby?.id ?? `empty-${i}`}
            layoutId={baby ? `piece-${baby.id}` : undefined}
            className={`tracker-pip ${isFilled ? "filled" : "empty"}`}
            transition={{
              layout: {
                type: "spring",
                stiffness: 100,
                damping: 20,
                duration: 0.5,
              },
            }}
          >
            🦎
          </motion.span>
        );
      })}
    </span>
  );
}

function Trackers() {
  const { state } = useGame();

  const escapedBabies = state.babies.filter((b) => b.isEscaped);
  const capturedBabies = state.babies.filter((b) => b.isCaptured);

  return (
    <div className="Trackers">
      <div className="tracker-section raptor">
        <div className="tracker-header">Raptor</div>
        <div className="tracker-row">
          <span className="tracker-label">Escaped</span>
          <BabyTrackerPips babies={escapedBabies} max={3} />
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
          <BabyTrackerPips babies={capturedBabies} max={3} />
        </div>
      </div>
    </div>
  );
}

export default Trackers;
