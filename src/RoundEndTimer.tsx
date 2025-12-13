import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import "./RoundEndTimer.css";

const COUNTDOWN_SECONDS = 3;
const TICK_MS = 800;

function RoundEndTimer() {
  const { dispatch } = useGame();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const skip = useCallback(() => {
    dispatch({ type: "ADVANCE_PHASE" });
  }, [dispatch]);

  useEffect(() => {
    const action = secondsLeft > 1 ? () => setSecondsLeft(secondsLeft - 1) : () => dispatch({ type: "ADVANCE_PHASE" });

    const timer = setTimeout(action, TICK_MS);
    return () => clearTimeout(timer);
  }, [secondsLeft, dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [skip]);

  return (
    <div className="RoundEndTimer">
      <div className="title">New Round in...</div>
      <motion.div
        className="countdown"
        key={secondsLeft}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {secondsLeft}
      </motion.div>
    </div>
  );
}

export default RoundEndTimer;
