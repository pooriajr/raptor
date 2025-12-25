import { motion } from "framer-motion";
import type { BabyState } from "./types/gameState.ts";
import { getPieceEmoji } from "./utils/pieceUtils.ts";

interface BabyPieceProps {
  baby: BabyState;
  isSelected: boolean;
}

function BabyPiece({ baby, isSelected }: BabyPieceProps) {
  const baseClasses = [
    "relative z-10 inline-block select-none pointer-events-none text-5xl",
    baby.isAsleep
      ? "saturate-[0.75] brightness-[0.95] origin-[50%_85%] animate-[asleep-rock_2.4s_ease-in-out_infinite]"
      : "",
    isSelected ? "animate-[piece-bounce_0.6s_ease-in-out_infinite]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.span
      layout
      layoutId={`piece-${baby.id}`}
      className={baseClasses}
      transition={{
        layout: {
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        },
      }}
    >
      {getPieceEmoji("baby")}
      {baby.isAsleep && <span className="absolute -top-2 -right-2 text-3xl">😴</span>}
    </motion.span>
  );
}

export default BabyPiece;
