import type { ReactNode } from "react";

type TooltipVariant = "card" | "space";
type TooltipPosition = "above" | "below" | "top" | "bottom" | "left" | "right";

interface TooltipProps {
  variant: TooltipVariant;
  position: TooltipPosition;
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

function Tooltip({ variant, position, title, description, className, children }: TooltipProps) {
  const isCard = variant === "card";
  const normalizedPosition = isCard ? (position === "below" ? "below" : "above") : position;
  const baseClass = isCard
    ? [
        "absolute",
        "left-1/2",
        "-translate-x-1/2",
        "bg-black/90",
        "text-white",
        "px-3.5",
        "py-2.5",
        "rounded-lg",
        "w-[280px]",
        "z-[10000]",
        "pointer-events-none",
        "shadow-[0_4px_12px_rgba(0,0,0,0.4)]",
      ].join(" ")
    : [
        "absolute",
        "bg-[rgba(20,20,35,0.8)]",
        "text-white",
        "px-3",
        "py-2",
        "rounded-md",
        "text-[0.95rem]",
        "w-max",
        "max-w-[200px]",
        "text-center",
        "pointer-events-none",
        "z-[3000]",
        "border",
        "border-white/15",
        "shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
      ].join(" ");
  const positionClass = isCard
    ? normalizedPosition === "below"
      ? "top-full mt-2"
      : "bottom-full mb-2"
    : normalizedPosition === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : normalizedPosition === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-2"
        : normalizedPosition === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-2"
          : "left-full top-1/2 -translate-y-1/2 ml-2";
  const classes = [baseClass, positionClass, className].filter(Boolean).join(" ");
  const arrowBase = "absolute h-0 w-0 border-[8px] border-transparent";
  const cardArrowUp = "top-full left-1/2 -translate-x-1/2 border-t-[rgba(0,0,0,0.9)]";
  const cardArrowDown = "bottom-full left-1/2 -translate-x-1/2 border-b-[rgba(0,0,0,0.9)]";
  const spaceArrowUp = "top-full left-1/2 -translate-x-1/2 border-t-[rgba(20,20,35,0.8)]";
  const spaceArrowDown = "bottom-full left-1/2 -translate-x-1/2 border-b-[rgba(20,20,35,0.8)]";
  const spaceArrowLeft = "left-full top-1/2 -translate-y-1/2 border-l-[rgba(20,20,35,0.8)]";
  const spaceArrowRight = "right-full top-1/2 -translate-y-1/2 border-r-[rgba(20,20,35,0.8)]";
  const arrowClass = isCard
    ? normalizedPosition === "below"
      ? cardArrowDown
      : cardArrowUp
    : normalizedPosition === "bottom"
      ? spaceArrowDown
      : normalizedPosition === "left"
        ? spaceArrowLeft
        : normalizedPosition === "right"
          ? spaceArrowRight
          : spaceArrowUp;
  const content =
    children ??
    ((title || description) && (
      <>
        {title && <div className="text-[13px] font-bold text-[#ffd700] mb-1.5">{title}</div>}
        {description && <div className="text-[12px] leading-[1.4] opacity-90">{description}</div>}
      </>
    ));

  if (!content) return null;

  return (
    <div className={classes}>
      {content}
      <span aria-hidden="true" className={`${arrowBase} ${arrowClass}`} />
    </div>
  );
}

export default Tooltip;
