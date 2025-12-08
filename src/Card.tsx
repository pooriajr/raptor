import { useState } from "react";
import { motion } from "framer-motion";
import "./Card.css";
import { getCardEffect, getCardIcon, getCardDescription } from "./utils/cardEffects";

interface CardProps {
  value: number;
  player: "raptor" | "scientist";
  faceUp?: boolean;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean; // When another card is selected, this card should be dimmed
  floating?: boolean; // Gentle up/down animation to indicate this card was played
  initialPosition?: { x: number; y: number };
  animationDelay?: number;
}

function Card({
  value,
  player,
  faceUp = false,
  onClick,
  selected = false,
  dimmed = false,
  floating = false,
  initialPosition,
  animationDelay = 0,
}: CardProps) {
  const isInteractive = onClick && !selected;
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine scale based on selection state
  const getScale = () => {
    if (selected) return 1.15;
    if (dimmed) return 0.9;
    return 1;
  };

  return (
    <motion.div
      className={`Card ${player} ${selected ? "selected" : ""} ${dimmed ? "dimmed" : ""}`}
      onClick={onClick}
      onMouseEnter={() => faceUp && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
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
        x: 0,
        y: floating ? [0, -10, 0] : 0,
        rotateY: faceUp ? 0 : 180,
        scale: floating ? 1.15 : getScale(),
        zIndex: selected || floating ? 10 : 0,
      }}
      transition={
        floating
          ? {
              y: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
              default: {
                duration: 0.25,
                delay: animationDelay,
                type: "tween",
                ease: "easeOut",
              },
            }
          : {
              duration: 0.25,
              delay: animationDelay,
              type: "tween",
              ease: "easeOut",
            }
      }
      whileHover={isInteractive ? { scale: 1.05 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Front face - shows the card value */}
      <div className="card-face card-front">
        <div className="card-value">{value}</div>
        <div className="card-icon">{getCardIcon(player, value)}</div>
        <div className="card-effect">{getCardEffect(player, value)}</div>
      </div>

      {/* Back face - shows the card back pattern */}
      <div className="card-face card-back">
        <div className="card-pattern">{player === "raptor" ? "🦖" : "🔬"}</div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className={`card-tooltip ${player === "raptor" ? "tooltip-below" : "tooltip-above"}`}>
          <div className="tooltip-title">{getCardEffect(player, value)}</div>
          <div className="tooltip-description">{getCardDescription(player, value)}</div>
        </div>
      )}
    </motion.div>
  );
}

export default Card;
