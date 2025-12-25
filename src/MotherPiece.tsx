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

  const visibleSleepTokens = Math.min(4, mother.sleepTokens);
  const dartOffsets = [
    { top: -12, right: 18 },
    { top: 0, right: 10 },
    { top: 12, right: 2 },
    { top: 24, right: -6 },
  ];

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
          {visibleSleepTokens > 0 &&
            dartOffsets.slice(0, visibleSleepTokens).map((offset, index) => (
              <span
                key={`sleep-dart-${index}`}
                className="absolute text-2xl rotate-180"
                style={{ top: `${offset.top}px`, right: `${offset.right}px` }}
              >
                {"💉"}
              </span>
            ))}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default MotherPiece;
