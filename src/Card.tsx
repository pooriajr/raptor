import { motion } from "framer-motion";
import "./Card.css";
import { getCardEffect } from "./utils/cardEffects";

interface CardProps {
  value: number;
  player: "raptor" | "scientist";
  faceUp?: boolean;
  onClick?: () => void;
  selected?: boolean;
  selectedOffsetX?: number;
  initialPosition?: { x: number; y: number };
  animationDelay?: number;
  onSelectionComplete?: () => void;
}

function Card({
  value,
  player,
  faceUp = false,
  onClick,
  selected = false,
  selectedOffsetX = 0,
  initialPosition,
  animationDelay = 0,
  onSelectionComplete,
}: CardProps) {
  const isInteractive = onClick && !selected;

  return (
    <motion.div
      className={`Card ${player} ${selected ? "selected" : ""}`}
      onClick={onClick}
      initial={
        initialPosition
          ? {
              x: initialPosition.x,
              y: initialPosition.y,
              rotateY: 180,
              scale: 0.5,
            }
          : { rotateY: faceUp ? 0 : 180, scale: 1 }
      }
      animate={{
        x: selected ? selectedOffsetX : 0,
        y: selected ? -140 : 0,
        rotateY: faceUp ? 0 : 180,
        scale: selected ? 1.2 : 1,
        zIndex: selected ? 10 : 0,
      }}
      transition={{
        duration: selected ? 0.2 : 0.6,
        delay: animationDelay,
        type: "spring",
        stiffness: selected ? 300 : 100,
        damping: selected ? 25 : 15,
      }}
      whileHover={isInteractive ? { scale: 1.05, y: -5 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      onAnimationComplete={() => selected && onSelectionComplete?.()}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Front face - shows the card value */}
      <div className="card-face card-front">
        <div className="card-value">{value}</div>
        <div className="card-effect">{getCardEffect(player, value)}</div>
      </div>

      {/* Back face - shows the card back pattern */}
      <div className="card-face card-back">
        <div className="card-pattern">{player === "raptor" ? "🦖" : "🔬"}</div>
      </div>
    </motion.div>
  );
}

export default Card;
