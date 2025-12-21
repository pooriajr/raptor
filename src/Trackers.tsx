import { motion } from "framer-motion";
import { useGame } from "./state/GameContext";

function TrackerPips({
  emoji,
  current,
  max,
  emptyClassName,
  slotClassName,
}: {
  emoji: string;
  current: number;
  max: number;
  emptyClassName: string;
  slotClassName: string;
}) {
  return (
    <span className="flex gap-2">
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < current;
        return (
          <span key={i} className={`relative ${slotClassName}`}>
            <span className={`empty text-[2rem] transition-[filter] duration-800 ${emptyClassName}`}>{emoji}</span>
            {isFilled && (
              <span className="filled absolute top-0 left-0 text-[2rem] opacity-100 filter-none">{emoji}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function BabyTrackerPips({
  babies,
  max,
  emptyClassName,
  slotClassName,
}: {
  babies: { id: string }[];
  max: number;
  emptyClassName: string;
  slotClassName: string;
}) {
  return (
    <span className="flex gap-2">
      {Array.from({ length: max }).map((_, i) => {
        const baby = babies[i];

        return (
          <span key={i} className={`relative ${slotClassName}`}>
            <span className={`empty text-[2rem] transition-[filter] duration-800 ${emptyClassName}`}>🦎</span>
            {baby && (
              <motion.span
                layoutId={`piece-${baby.id}`}
                className="filled absolute top-0 left-0 text-[2rem] opacity-100 filter-none"
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                    duration: 0.3,
                  },
                }}
              >
                🦎
              </motion.span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function Trackers() {
  const { state } = useGame();

  const escapedBabies = Object.values(state.babies).filter((b) => b.isEscaped);
  const capturedBabies = Object.values(state.babies).filter((b) => b.isCaptured);

  const escapedEmpty =
    "[filter:brightness(0)_drop-shadow(1px_0_0_#2d5a27)_drop-shadow(-1px_0_0_#2d5a27)_drop-shadow(0_1px_0_#2d5a27)_drop-shadow(0_-1px_0_#2d5a27)] opacity-50";
  const escapedSlot =
    "has-[.filled]:[&_.empty]:[filter:grayscale(1)_contrast(0)_brightness(0)_drop-shadow(1px_0_0_#8bc34a)_drop-shadow(-1px_0_0_#8bc34a)_drop-shadow(0_1px_0_#8bc34a)_drop-shadow(0_-1px_0_#8bc34a)] has-[.filled]:[&_.empty]:opacity-100";
  const sleepEmpty =
    "[filter:brightness(0)_drop-shadow(1px_0_0_#5a2020)_drop-shadow(-1px_0_0_#5a2020)_drop-shadow(0_1px_0_#5a2020)_drop-shadow(0_-1px_0_#5a2020)] opacity-50";
  const sleepSlot =
    "has-[.filled]:[&_.empty]:[filter:grayscale(1)_contrast(0)_brightness(0)_drop-shadow(1px_0_0_#ff4444)_drop-shadow(-1px_0_0_#ff4444)_drop-shadow(0_1px_0_#ff4444)_drop-shadow(0_-1px_0_#ff4444)] has-[.filled]:[&_.empty]:opacity-100";
  const capturedEmpty =
    "[filter:brightness(0)_drop-shadow(1px_0_0_#6b4a20)_drop-shadow(-1px_0_0_#6b4a20)_drop-shadow(0_1px_0_#6b4a20)_drop-shadow(0_-1px_0_#6b4a20)] opacity-50";
  const capturedSlot =
    "has-[.filled]:[&_.empty]:[filter:grayscale(1)_contrast(0)_brightness(0)_drop-shadow(1px_0_0_#ffb347)_drop-shadow(-1px_0_0_#ffb347)_drop-shadow(0_1px_0_#ffb347)_drop-shadow(0_-1px_0_#ffb347)] has-[.filled]:[&_.empty]:opacity-100";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-w-50 flex-col gap-3 rounded-xl bg-[linear-gradient(135deg,#2d5a27_0%,#1a3518_100%)] p-4">
        <div className="border-b border-white/20 pb-2 text-center text-[1.4rem] font-bold tracking-[2px] text-[#b8e6b0] uppercase">
          Raptor
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[0.9rem] tracking-[1px] text-[#8bc090] uppercase">Escaped</span>
          <BabyTrackerPips babies={escapedBabies} max={3} emptyClassName={escapedEmpty} slotClassName={escapedSlot} />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[0.9rem] tracking-[1px] text-[#8bc090] uppercase">Sleep Tokens</span>
          <TrackerPips
            emoji="💉"
            current={state.mother.sleepTokens ?? 0}
            max={5}
            emptyClassName={sleepEmpty}
            slotClassName={sleepSlot}
          />
        </div>
      </div>

      <div className="flex min-w-50 flex-col gap-3 rounded-xl bg-[linear-gradient(135deg,#8a5a1a_0%,#5a3810_100%)] p-4">
        <div className="border-b border-white/20 pb-2 text-center text-[1.4rem] font-bold tracking-[2px] text-[#f0d4a8] uppercase">
          Scientist
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[0.9rem] tracking-[1px] text-[#d4b080] uppercase">Captured</span>
          <BabyTrackerPips
            babies={capturedBabies}
            max={3}
            emptyClassName={capturedEmpty}
            slotClassName={capturedSlot}
          />
        </div>
      </div>
    </div>
  );
}

export default Trackers;
