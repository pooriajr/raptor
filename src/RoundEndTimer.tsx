import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import "./RoundEndTimer.css";

const COUNTDOWN_SECONDS = 3;
const TICK_MS = 600;

function RoundEndTimer() {
  const { dispatch } = useGame();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const action = secondsLeft > 1 ? () => setSecondsLeft(secondsLeft - 1) : () => dispatch({ type: "ADVANCE_PHASE" });

    const timer = setTimeout(action, TICK_MS);
    return () => clearTimeout(timer);
  }, [secondsLeft, dispatch]);

  return (
    <div className="RoundEndTimer">
      <div className="title">Round End</div>
      <motion.div
        className="countdown"
        key={secondsLeft}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {secondsLeft}
      </motion.div>
      <div className="subtitle">Next round starting...</div>
    </div>
  );
}

export default RoundEndTimer;
