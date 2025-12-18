import { useState } from "react";
import { motion } from "framer-motion";
import "./Tooltip.css";
import type { CardInfo } from "@/data/cards.ts";

interface CardProps {
  card: CardInfo;
  faceUp?: boolean;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean; // When another card is selected, this card should be dimmed
  floating?: boolean; // Gentle up/down animation to indicate this card was played
  initialPosition?: { x: number; y: number };
  animationDelay?: number;
  layoutDelay?: number; // Delay for layoutId animations (staggering cards)
  layoutId?: string; // For cross-container animations
  hideTooltip?: boolean; // Disable tooltip on hover
  skipAnimation?: boolean; // Skip mount animation (for static displays)
}

function Card({
  card,
  faceUp = false,
  onClick,
  selected = false,
  dimmed = false,
  floating = false,
  initialPosition,
  animationDelay = 0,
  layoutDelay = 0,
  layoutId,
  hideTooltip = false,
  skipAnimation = false,
}: CardProps) {
  const { value, player, name, icon, description, effectCount } = card;
  const isInteractive = onClick && !selected;
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine scale based on selection state
  const getScale = () => {
    if (selected) return 1.15;
    if (dimmed) return 0.9;
    return 1;
  };

  // Card face base classes
  const cardFaceBase =
    "absolute w-full h-full backface-hidden rounded-lg flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.3)] border";

  // Player-specific styles
  const isRaptor = player === "raptor";
  const borderColor = isRaptor ? "border-[#5a7a52]" : "border-[#a08060]";
  const frontBg = isRaptor
    ? "bg-[linear-gradient(145deg,#2d5a27,#1a3518)]"
    : "bg-[linear-gradient(145deg,#8a5a1a,#5a3810)]";
  const frontText = isRaptor ? "text-[#90ee90]" : "text-[#ffb347]";
  const backBg = isRaptor
    ? "bg-[linear-gradient(145deg,#3d6a37,#2a4a22)]"
    : "bg-[linear-gradient(145deg,#8a5a1a,#5a3810)]";

  // Selected card glow
  const selectedStyles = selected
    ? "border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.6),0_4px_12px_rgba(0,0,0,0.4)]"
    : "";

  // Dimmed card filter
  const dimmedStyles = dimmed ? "saturate-[0.4] brightness-[0.7]" : "";

  return (
    <motion.div
      className="w-[150px] h-[210px] relative cursor-default [transform-style:preserve-3d] [perspective:1000px]"
      layoutId={layoutId}
      onClick={onClick}
      onMouseEnter={() => faceUp && !hideTooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      initial={
        skipAnimation
          ? false
          : initialPosition
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
              layout: {
                duration: 0.15,
                delay: layoutDelay,
                type: "spring",
                stiffness: 500,
                damping: 35,
              },
            }
          : {
              duration: 0.25,
              delay: animationDelay,
              type: "tween",
              ease: "easeOut",
              layout: {
                duration: 0.15,
                delay: layoutDelay,
                type: "spring",
                stiffness: 500,
                damping: 35,
              },
            }
      }
      whileHover={isInteractive ? { scale: 1.05 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Front face - shows the card value */}
      <div
        className={`${cardFaceBase} ${borderColor} ${frontBg} ${frontText} ${selectedStyles} ${dimmedStyles} [transform:rotateY(0deg)]`}
      >
        <div className="absolute top-2 left-3 font-display text-4xl [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
          {value}
        </div>
        <div className="text-5xl my-1.5 [filter:drop-shadow(1px_1px_2px_rgba(0,0,0,0.3))] flex flex-row flex-wrap items-center justify-center gap-1 leading-none flex-1 pt-5">
          {Array.from({ length: Math.max(1, effectCount) }, (_, i) => (
            <span key={i} className="inline-block">
              {icon}
            </span>
          ))}
        </div>
        <div className="text-[15px] text-center px-2 opacity-90 leading-tight mt-auto pb-2.5">{name}</div>
      </div>

      {/* Back face - shows the card back pattern */}
      <div className={`${cardFaceBase} ${borderColor} ${backBg} ${selectedStyles} [transform:rotateY(180deg)]`}>
        <div className="text-[42px] opacity-60">{isRaptor ? "🦖" : "🔬"}</div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className={`card-tooltip ${isRaptor ? "tooltip-below" : "tooltip-above"}`}>
          <div className="tooltip-title">{name}</div>
          <div className="tooltip-description">{description}</div>
        </div>
      )}
    </motion.div>
  );
}

export default Card;
