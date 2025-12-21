import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import { playSfx } from "./audio/sfx.ts";

const COUNTDOWN_SECONDS = 3;
const TICK_MS = 800;

function RoundEndTimer() {
  const { dispatch } = useGame();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const didStartRef = useRef(false);

  const skip = useCallback(() => {
    dispatch({ type: "ADVANCE_PHASE" });
  }, [dispatch]);

  useEffect(() => {
    const action = secondsLeft > 1 ? () => setSecondsLeft(secondsLeft - 1) : () => dispatch({ type: "ADVANCE_PHASE" });

    const timer = setTimeout(action, TICK_MS);
    return () => clearTimeout(timer);
  }, [secondsLeft, dispatch]);

  useEffect(() => {
    if (!didStartRef.current) {
      didStartRef.current = true;
      return;
    }
    playSfx("anim_round_end_tick");
  }, [secondsLeft]);

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
    <div className="absolute top-1/2 left-1/2 z-500 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-[#666] bg-[rgba(20,20,20,0.95)] px-10 py-6 text-center text-white">
      <div className="mb-2 text-[1.2rem] font-bold text-[#ccc]">New Round in...</div>
      <motion.div
        className="my-2 font-['Bungee'] text-[3rem] leading-none font-bold text-[#7cb7ff]"
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
