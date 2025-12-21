import { motion } from "framer-motion";
import type { BabyState } from "./types/gameState.ts";
import type { PieceType } from "./utils/pieceUtils.ts";
import { getPieceEmoji } from "./utils/pieceUtils.ts";

interface PieceProps {
  id: string;
  type: PieceType;
  isAsleep?: boolean;
  isSelected: boolean;
}

function Piece({ id, type, isAsleep, isSelected }: PieceProps) {
  const baseClasses = [
    "relative z-10 inline-block select-none pointer-events-none text-5xl",
    type === "mother" ? "text-7xl -m-3 z-20" : "",
    isAsleep
      ? "saturate-[0.75] brightness-[0.95] origin-[50%_85%] animate-[asleep-rock_2.4s_ease-in-out_infinite]"
      : "",
    isSelected ? "animate-[piece-bounce_0.6s_ease-in-out_infinite]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.span
      layout
      layoutId={`piece-${id}`}
      className={baseClasses}
      transition={{
        layout: {
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        },
      }}
    >
      {getPieceEmoji(type)}
      {isAsleep && <span className="absolute -top-2 -right-2 text-3xl">😴</span>}
    </motion.span>
  );
}

// Helper to create props from BabyState
export function BabyPiece({ baby, isSelected }: { baby: BabyState; isSelected: boolean }) {
  return <Piece id={baby.id} type="baby" isAsleep={baby.isAsleep} isSelected={isSelected} />;
}

export default Piece;
