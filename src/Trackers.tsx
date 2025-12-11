import { motion } from "framer-motion";
import { useGame } from "./state/GameContext";
import "./Trackers.css";

function TrackerPips({ emoji, current, max }: { emoji: string; current: number; max: number }) {
  return (
    <span className="tracker-pips">
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < current;
        return (
          <span key={i} className={`tracker-pip-slot${isFilled ? " has-pip" : ""}`}>
            <span className="tracker-pip empty">{emoji}</span>
            {isFilled && <span className="tracker-pip filled">{emoji}</span>}
          </span>
        );
      })}
    </span>
  );
}

function BabyTrackerPips({ babies, max }: { babies: { id: string }[]; max: number }) {
  return (
    <span className="tracker-pips">
      {Array.from({ length: max }).map((_, i) => {
        const baby = babies[i];

        return (
          <span key={i} className={`tracker-pip-slot${baby ? " has-baby" : ""}`}>
            <span className="tracker-pip empty">🦎</span>
            {baby && (
              <motion.span
                layoutId={`piece-${baby.id}`}
                className="tracker-pip filled"
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                    duration: 0.3,
                  },
                }}
              >
                🦎
              </motion.span>
            )}
          </span>
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
        <div className="tracker-row escaped">
          <span className="tracker-label">Escaped</span>
          <BabyTrackerPips babies={escapedBabies} max={3} />
        </div>
        <div className="tracker-row sleep-tokens">
          <span className="tracker-label">Sleep Tokens</span>
          <TrackerPips emoji="💉" current={state.motherSleepTokens ?? 0} max={5} />
        </div>
      </div>

      <div className="tracker-section scientist">
        <div className="tracker-header">Scientist</div>
        <div className="tracker-row captured">
          <span className="tracker-label">Captured</span>
          <BabyTrackerPips babies={capturedBabies} max={3} />
        </div>
      </div>
    </div>
  );
}

export default Trackers;
