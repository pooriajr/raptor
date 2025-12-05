import { motion, AnimatePresence } from "framer-motion";
import "./CardSelectionOverlay.css";

interface CardSelectionOverlayProps {
  selectedCard: number | null;
  player: "raptor" | "scientist";
  onConfirm: () => void;
  onCancel: () => void;
}

function CardSelectionOverlay({
  selectedCard,
  player,
  onConfirm,
  onCancel,
}: CardSelectionOverlayProps) {
  if (selectedCard === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`CardSelectionOverlay ${player}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="selection-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.5, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.5, y: 100 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="selected-card-display">
            <div className={`big-card ${player}`}>
              <div className="big-card-value">{selectedCard}</div>
              <div className="big-card-icon">
                {player === "raptor" ? "🦖" : "🔬"}
              </div>
            </div>
          </div>
          <div className="selection-actions">
            <button className="cancel-button" onClick={onCancel}>
              Go Back
            </button>
            <button className="confirm-button" onClick={onConfirm}>
              Confirm Choice
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CardSelectionOverlay;
