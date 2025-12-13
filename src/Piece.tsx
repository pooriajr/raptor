import "./Piece.css";
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
  return (
    <motion.span
      layout
      layoutId={`piece-${id}`}
      className={`piece piece-${type} ${isAsleep ? "asleep" : ""} ${isSelected ? "action-selected" : ""}`}
      transition={{
        layout: {
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        },
      }}
    >
      {getPieceEmoji(type)}
      {isAsleep && <span className="status-icon">😴</span>}
    </motion.span>
  );
}

// Helper to create props from BabyState
export function BabyPiece({ baby, isSelected }: { baby: BabyState; isSelected: boolean }) {
  return <Piece id={baby.id} type="baby" isAsleep={baby.isAsleep} isSelected={isSelected} />;
}

export default Piece;
