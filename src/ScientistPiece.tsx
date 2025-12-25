import { motion } from "framer-motion";
import type { ScientistState } from "./types/gameState.ts";

interface ScientistPieceProps {
  scientist: ScientistState;
  isSelected: boolean;
  emoji?: string;
}

function ScientistPiece({ scientist, isSelected, emoji }: ScientistPieceProps) {
  if (!scientist.position) return null;

  const { isFrightened, hasUsedAggressiveAction } = scientist;
  const displayEmoji = emoji ?? "🧑‍🔬";
  const className = [
    "relative z-10 inline-block select-none pointer-events-none text-5xl",
    isFrightened ? "animate-[shake_0.5s_ease-in-out_infinite]" : "",
    isSelected ? "animate-[piece-bounce_0.6s_ease-in-out_infinite]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.span
      layout
      layoutId={`piece-${scientist.id}`}
      className={className}
      transition={{
        layout: {
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        },
      }}
    >
      {displayEmoji}
      {isFrightened && <span className="absolute -top-2 -right-2 text-3xl">😨</span>}
      {hasUsedAggressiveAction && <span className="absolute -top-2 -right-2 text-3xl">😡</span>}
    </motion.span>
  );
}

export default ScientistPiece;
