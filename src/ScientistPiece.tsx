import "./Piece.css";
import { motion } from "framer-motion";
import type { ScientistState } from "./types/gameState.ts";

interface ScientistPieceProps {
  scientist: ScientistState;
  isSelected: boolean;
}

function ScientistPiece({ scientist, isSelected }: ScientistPieceProps) {
  if (!scientist.position) return null;

  const { isFrightened, hasUsedAggressiveAction } = scientist;

  return (
    <motion.span
      layout
      layoutId={`piece-${scientist.id}`}
      className={`piece piece-scientist ${isFrightened ? "frightened" : ""} ${isSelected ? "action-selected" : ""}`}
      transition={{
        layout: {
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        },
      }}
    >
      {"🧑‍🔬"}
      {isFrightened && <span className="status-icon">😨</span>}
      {hasUsedAggressiveAction && <span className="status-icon">😡</span>}
    </motion.span>
  );
}

export default ScientistPiece;
