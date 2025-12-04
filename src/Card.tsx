import { motion } from "framer-motion";
import "./Card.css";

interface CardProps {
  value: number;
  player: "raptor" | "scientist";
  faceUp?: boolean;
  onClick?: () => void;
  selected?: boolean;
  // For animation - position to animate from
  initialPosition?: { x: number; y: number };
  // Delay before animation starts
  animationDelay?: number;
}

function Card({
  value,
  player,
  faceUp = false,
  onClick,
  selected = false,
  initialPosition,
  animationDelay = 0,
}: CardProps) {
  return (
    <motion.div
      className={`Card ${player} ${selected ? "selected" : ""}`}
      onClick={onClick}
      initial={
        initialPosition
          ? { x: initialPosition.x, y: initialPosition.y, rotateY: 180 }
          : { rotateY: faceUp ? 0 : 180 }
      }
      animate={{
        x: 0,
        y: 0,
        rotateY: faceUp ? 0 : 180,
      }}
      transition={{
        duration: 0.6,
        delay: animationDelay,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      whileHover={onClick ? { scale: 1.05, y: -5 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Front face - shows the card value */}
      <div className="card-face card-front">
        <div className="card-value">{value}</div>
        <div className="card-icon">{player === "raptor" ? "🦖" : "🔬"}</div>
      </div>

      {/* Back face - shows the card back pattern */}
      <div className="card-face card-back">
        <div className="card-pattern">{player === "raptor" ? "🦖" : "🔬"}</div>
      </div>
    </motion.div>
  );
}

export default Card;
