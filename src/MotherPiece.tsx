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

  const shouldKeepMountedForExit =
    mother.disappeared &&
    mother.position === null &&
    mother.lastPosition?.tileId === spacePosition.tileId &&
    mother.lastPosition?.x === spacePosition.x &&
    mother.lastPosition?.y === spacePosition.y;

  if (!motherIsHere && !shouldKeepMountedForExit) return null;

  const className = [
    "relative z-20 inline-block select-none pointer-events-none text-7xl -m-3",
    isSelected ? "animate-[piece-bounce_0.6s_ease-in-out_infinite]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AnimatePresence>
      {motherIsHere && (
        <motion.span
          key="mother"
          layout
          layoutId={`piece-${mother.id}`}
          className={className}
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
          {mother.sleepTokens > 0 && <span className="absolute -top-2 -right-2 text-3xl">{mother.sleepTokens}</span>}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default MotherPiece;
