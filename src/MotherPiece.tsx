import "./Piece.css";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MotherState } from "./types/gameState.ts";

interface MotherPieceProps {
  mother: MotherState;
  isSelected: boolean;
  spacePosition: { tileId: number; x: number; y: number };
}

function MotherPiece({ mother, isSelected, spacePosition }: MotherPieceProps) {
  const motherIsHere =
    mother.position?.tileId === spacePosition.tileId &&
    mother.position?.x === spacePosition.x &&
    mother.position?.y === spacePosition.y;

  // Track if mother was on this space (for exit animation)
  const motherWasHere = useRef(false);
  const [showAnimatePresence, setShowAnimatePresence] = useState(false);

  useEffect(() => {
    if (motherIsHere) {
      motherWasHere.current = true;
      setShowAnimatePresence(true);
    } else if (motherWasHere.current && mother.disappeared) {
      // Mother just disappeared - keep AnimatePresence mounted for exit animation
    } else if (!mother.disappeared) {
      motherWasHere.current = false;
      setShowAnimatePresence(false);
    }
  }, [motherIsHere, mother.disappeared]);

  if (!showAnimatePresence) return null;

  return (
    <AnimatePresence>
      {motherIsHere && (
        <motion.span
          key="mother"
          layout
          layoutId={`piece-${mother.id}`}
          className={`piece piece-mother ${isSelected ? "action-selected" : ""}`}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{
            y: { duration: 0.4, ease: "easeOut" },
            opacity: { duration: 0.4 },
            layout: {
              type: "tween",
              duration: 0.2,
              ease: "easeOut",
            },
          }}
        >
          {"🦖"}
          {mother.sleepTokens > 0 && <span className="status-icon sleep-tokens">{mother.sleepTokens}</span>}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default MotherPiece;
