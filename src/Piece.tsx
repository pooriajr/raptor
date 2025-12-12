import "./Piece.css";
import { motion } from "framer-motion";
import type { PieceState } from "./types/gameState.ts";
import { getPieceEmoji } from "./utils/pieceUtils.ts";

interface PieceProps {
  piece: PieceState;
  isSelected: boolean;
}

function Piece({ piece, isSelected }: PieceProps) {
  return (
    <motion.span
      layout
      layoutId={`piece-${piece.id}`}
      className={`piece piece-${piece.type} ${piece.isAsleep ? "asleep" : ""} ${isSelected ? "action-selected" : ""}`}
      transition={{
        layout: {
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        },
      }}
    >
      {getPieceEmoji(piece.type)}
      {piece.isAsleep && <span className="status-icon">💤</span>}
    </motion.span>
  );
}

export default Piece;
