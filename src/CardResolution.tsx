import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "./state/GameContext.tsx";
import { useReveal } from "./revealContext.ts";
import type { CardInfo } from "@/data/cards.ts";

type HalfState = "active" | "done" | "hidden" | "neutral";

interface CardResolutionDisplayProps {
  raptorContent: React.ReactNode;
  scientistContent: React.ReactNode;
  raptorState?: HalfState;
  scientistState?: HalfState;
  static?: boolean;
}

// Presentational component - renders the resolution display with no state management
export function CardResolutionDisplay({
  raptorContent,
  scientistContent,
  raptorState = "neutral",
  scientistState = "neutral",
  static: isStatic = false,
}: CardResolutionDisplayProps) {
  const halfBase = "flex flex-1 items-center justify-center text-center";
  const raptorClassName = [
    halfBase,
    "bg-[linear-gradient(180deg,#2d5a27_0%,#1a3518_100%)] text-[#a5d6a7]",
    raptorState === "active" ? "animate-[pulse-raptor_1.5s_ease-in-out_infinite]" : "",
    raptorState === "done" ? "grayscale opacity-50" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const scientistClassName = [
    halfBase,
    "bg-[linear-gradient(0deg,#8a5a1a_0%,#5a3810_100%)] text-[#ffcc80]",
    scientistState === "active" ? "animate-[pulse-scientist_1.5s_ease-in-out_infinite]" : "",
    scientistState === "done" ? "grayscale opacity-50" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showRaptorHalf = raptorState !== "hidden";
  const showScientistHalf = scientistState !== "hidden";

  if (isStatic) {
    return (
      <div className="relative z-1001 flex h-60 w-60 flex-col overflow-hidden rounded-3xl">
        {showRaptorHalf && <div className={raptorClassName}>{raptorContent}</div>}
        <div className="h-0.5" />
        {showScientistHalf && <div className={scientistClassName}>{scientistContent}</div>}
      </div>
    );
  }

  return (
    <div className="relative z-1001 flex h-60 w-60 flex-col overflow-hidden rounded-3xl">
      <motion.div
        className={raptorClassName}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showRaptorHalf ? 1 : 0, scale: showRaptorHalf ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {raptorContent}
      </motion.div>
      <div className="h-0.5" />
      <motion.div
        className={scientistClassName}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showScientistHalf ? 1 : 0, scale: showScientistHalf ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {scientistContent}
      </motion.div>
    </div>
  );
}

// Helper to build effect content from a card
export function EffectContent({ card, usedCount = 0 }: { card: CardInfo; usedCount?: number }) {
  const { effectCount, icon, name } = card;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-center gap-4">
        {effectCount > 0 ? (
          Array.from({ length: effectCount }, (_, i) => (
            <span
              key={i}
              className={[
                "text-[3rem] filter-[grayscale(0)_contrast(1)_brightness(1)_drop-shadow(1px_0_0_currentColor)_drop-shadow(-1px_0_0_currentColor)_drop-shadow(0_1px_0_currentColor)_drop-shadow(0_-1px_0_currentColor)] transition-[filter] duration-300",
                i < usedCount
                  ? "filter-[grayscale(1)_contrast(0)_brightness(0.3)_drop-shadow(1px_0_0_currentColor)_drop-shadow(-1px_0_0_currentColor)_drop-shadow(0_1px_0_currentColor)_drop-shadow(0_-1px_0_currentColor)]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {icon}
            </span>
          ))
        ) : (
          <span className="text-[3rem] filter-[grayscale(0)_contrast(1)_brightness(1)_drop-shadow(1px_0_0_currentColor)_drop-shadow(-1px_0_0_currentColor)_drop-shadow(0_1px_0_currentColor)_drop-shadow(0_-1px_0_currentColor)]">
            {icon}
          </span>
        )}
      </div>
      <span className="text-[0.8rem] tracking-[1px] uppercase opacity-90">{name}</span>
    </div>
  );
}

// Helper to build action points content
export function ActionPointsContent({ actionPoints, animate = true }: { actionPoints: number; animate?: boolean }) {
  if (animate) {
    return (
      <div className="flex flex-col items-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={actionPoints}
            className="font-['Bungee'] text-[3.6rem] leading-none"
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {actionPoints}
          </motion.span>
        </AnimatePresence>
        <span className="text-[1.2rem] tracking-[1px] uppercase opacity-80">AP</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <span className="font-['Bungee'] text-[3.6rem] leading-none">{actionPoints}</span>
      <span className="text-[1.2rem] tracking-[1px] uppercase opacity-80">AP</span>
    </div>
  );
}

// Container component - manages state and passes to CardResolutionDisplay
function CardResolution() {
  const { state } = useGame();
  const { stage: revealStage, effectPlayer } = useReveal();

  const { activeEffectCard, actionPoints, effectActionsRemaining } = state;

  const isCardReveal = state.phase === "CARD_REVEAL";
  const isRoundEnd = state.phase === "ROUND_END";

  // During CARD_REVEAL, control visibility based on reveal stage
  const isShowingEffect = revealStage === "show-effect" || revealStage === "show-ap" || revealStage === "complete";
  const isShowingAP = revealStage === "show-ap" || revealStage === "complete";

  // Hide if there's no effect or action points to display
  if (!activeEffectCard && actionPoints === 0) {
    return null;
  }

  // During CARD_REVEAL, hide until reveal reaches the appropriate stage
  if (isCardReveal && !isShowingEffect) {
    return null;
  }

  // Show resolution when we have an active effect card or action points
  const showResolution = activeEffectCard !== null || actionPoints > 0;

  let raptorContent = null;
  let scientistContent = null;
  let raptorState: HalfState = "neutral";
  let scientistState: HalfState = "neutral";

  if (showResolution) {
    if (activeEffectCard) {
      // Someone gets the effect, other gets action points
      const usedCount = activeEffectCard.effectCount - effectActionsRemaining;

      const effectContent = <EffectContent card={activeEffectCard} usedCount={usedCount} />;
      const apContent = <ActionPointsContent actionPoints={actionPoints} />;

      if (activeEffectCard.player === "raptor") {
        raptorContent = effectContent;
        scientistContent = apContent;
        const raptorDone = state.activePlayer === "scientist" || isRoundEnd;
        const scientistDone = isRoundEnd || state.phase === "MOTHER_RETURN";
        if (state.activePlayer === "raptor") raptorState = "active";
        else if (!isCardReveal && raptorDone) raptorState = "done";
        if (state.activePlayer === "scientist") scientistState = "active";
        else if (!isCardReveal && scientistDone) scientistState = "done";
      } else {
        scientistContent = effectContent;
        raptorContent = apContent;
        const scientistDone = state.activePlayer === "raptor" || isRoundEnd;
        const raptorDone = isRoundEnd;
        if (state.activePlayer === "scientist") scientistState = "active";
        else if (!isCardReveal && scientistDone) scientistState = "done";
        if (state.activePlayer === "raptor") raptorState = "active";
        else if (!isCardReveal && raptorDone) raptorState = "done";
      }
    } else {
      // Tied - no effect card, no action points displayed
      raptorContent = <span className="text-[1.6rem] italic opacity-60">Tied</span>;
      scientistContent = <span className="text-[1.6rem] italic opacity-60">Tied</span>;
    }
  }

  // During reveal, control which half is visible based on stage
  // Effect player's half shows first (show-effect), then AP player's half (show-ap)
  if (isCardReveal) {
    const raptorGetsEffect = effectPlayer === "raptor";
    const showRaptorHalf = raptorGetsEffect ? isShowingEffect : isShowingAP;
    const showScientistHalf = raptorGetsEffect ? isShowingAP : isShowingEffect;
    if (!showRaptorHalf) raptorState = "hidden";
    if (!showScientistHalf) scientistState = "hidden";
  }

  return (
    <CardResolutionDisplay
      raptorContent={raptorContent}
      scientistContent={scientistContent}
      raptorState={raptorState}
      scientistState={scientistState}
    />
  );
}

export default CardResolution;
