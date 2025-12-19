import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Tutorial.css";
import WelcomeSlide from "./WelcomeSlide";
import GameElementsSlide from "./GameElementsSlide";
import PlayingARoundSlide from "./PlayingARoundSlide";
import RaptorCardsSlide from "./RaptorCardsSlide";
import ScientistCardsSlide from "./ScientistCardsSlide";
import ActionPointsSlide from "./ActionPointsSlide";

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
    title: "Action Points",
    content: <ActionPointsSlide />,
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
    <div className="Tutorial" onClick={onClose}>
      <div className="tutorial-container" onClick={(e) => e.stopPropagation()}>
        <button className="tutorial-close" onClick={onClose}>
          ✕
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="tutorial-slide"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="tutorial-title">{slides[currentSlide].title}</h2>
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        <div className="tutorial-navigation">
          <button className="nav-button prev" onClick={prevSlide} disabled={isFirstSlide}>
            ← Previous
          </button>

          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slide-dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>

          <button className="nav-button next" onClick={nextSlide} disabled={isLastSlide}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
