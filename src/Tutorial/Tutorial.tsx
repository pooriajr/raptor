import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WelcomeSlide from "./WelcomeSlide";
import GameElementsSlide from "./GameElementsSlide";
import PlayingARoundSlide from "./PlayingARoundSlide";
import RaptorCardsSlide from "./RaptorCardsSlide";
import ScientistCardsSlide from "./ScientistCardsSlide";
import RaptorActionsSlide from "./RaptorActionsSlide";
import ScientistActionsSlide from "./ScientistActionsSlide";

interface TutorialProps {
  onClose: () => void;
}

interface TutorialSlide {
  title: string;
  content: React.ReactNode;
}

const slides: TutorialSlide[] = [
  {
    title: "Welcome to Raptor",
    content: <WelcomeSlide />,
  },
  {
    title: "Game Elements",
    content: <GameElementsSlide />,
  },
  {
    title: "Playing a Round",
    content: <PlayingARoundSlide />,
  },
  {
    title: "Raptor Card Effects",
    content: <RaptorCardsSlide />,
  },
  {
    title: "Scientist Card Effects",
    content: <ScientistCardsSlide />,
  },
  {
    title: "Raptor Actions",
    content: <RaptorActionsSlide />,
  },
  {
    title: "Scientist Actions",
    content: <ScientistActionsSlide />,
  },
];

function Tutorial({ onClose }: TutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-[rgba(15,15,30,0.9)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] w-[95%] max-w-300 flex-col rounded-2xl border border-white/10 bg-[rgba(30,30,50,0.95)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 p-0 text-[1.5rem] leading-none text-white/60 transition-all duration-200 hover:bg-white/20 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="flex-1 overflow-y-auto pr-2 has-[.board-overview-full]:overflow-visible"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-6 text-center font-['Bungee'] text-[1.5rem] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.3)] md:text-[2rem]">
              {slides[currentSlide].title}
            </h2>
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            className="min-w-25 rounded-lg bg-white/10 px-4 py-2 text-[0.9rem] font-bold text-white/80 transition-all duration-200 enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 md:min-w-32.5 md:px-6 md:py-3 md:text-[1rem]"
            onClick={prevSlide}
            disabled={isFirstSlide}
          >
            ← Previous
          </button>

          <div className="flex flex-1 flex-wrap items-center justify-center gap-2 px-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${index === currentSlide ? "scale-110 bg-[#4a8a4a]" : "bg-white/20 hover:bg-white/40"}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>

          <button
            className="min-w-25 rounded-lg bg-[linear-gradient(145deg,#4a8a4a,#2a6a2a)] px-4 py-2 text-[0.9rem] font-bold text-white transition-all duration-200 enabled:hover:scale-105 enabled:hover:shadow-[0_4px_12px_rgba(74,138,74,0.4)] disabled:cursor-not-allowed disabled:opacity-30 md:min-w-32.5 md:px-6 md:py-3 md:text-[1rem]"
            onClick={nextSlide}
            disabled={isLastSlide}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
