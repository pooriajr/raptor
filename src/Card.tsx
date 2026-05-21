import { useState } from "react";
import { motion } from "framer-motion";
import Tooltip from "./Tooltip.tsx";
import type { CardInfo } from "@/data/cards.ts";
import { assetUrl } from "./utils/assetUrl";

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
  const { value, player, name, description } = card;
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
    "absolute h-full w-full backface-hidden rounded-xl border-2 border-white object-fill shadow-[0_2px_8px_rgba(0,0,0,0.3)]";

  // Player-specific styles
  const isRaptor = player === "raptor";
  const frontImageSrc = isRaptor ? assetUrl(`images/r${value}.png`) : assetUrl(`images/s${value}.png`);
  const backImageSrc = isRaptor ? assetUrl("images/rback.png") : assetUrl("images/sback.png");

  // Selected card glow
  const selectedStyles = selected
    ? "border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.6),0_4px_12px_rgba(0,0,0,0.4)]"
    : "";

  // Dimmed card filter
  const dimmedStyles = dimmed ? "saturate-[0.4] brightness-[0.7]" : "";

  return (
    <motion.div
      className="relative h-52.5 w-37.5 cursor-default perspective-[1000px] transform-3d"
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
      <img
        className={`${cardFaceBase} ${selectedStyles} ${dimmedStyles} transform-[rotateY(0deg)]`}
        src={frontImageSrc}
        alt={`${name} card`}
      />

      {/* Back face - shows the card back pattern */}
      <img
        className={`${cardFaceBase} ${selectedStyles} transform-[rotateY(180deg)]`}
        src={backImageSrc}
        alt="Card back"
      />

      {/* Tooltip */}
      {showTooltip && (
        <Tooltip variant="card" position={isRaptor ? "below" : "above"} title={name} description={description} />
      )}
    </motion.div>
  );
}

export default Card;
