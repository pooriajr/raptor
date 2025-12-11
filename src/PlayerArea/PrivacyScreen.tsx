import { motion, AnimatePresence } from "framer-motion";
import "./PrivacyScreen.css";

interface PrivacyScreenProps {
  player: "raptor" | "scientist";
  visible: boolean;
  onDismiss: () => void;
}

function PrivacyScreen({ player, visible, onDismiss }: PrivacyScreenProps) {
  const isScientist = player === "scientist";
  const currentPlayer = isScientist ? "Scientist" : "Raptor";
  const otherPlayer = isScientist ? "Raptor" : "Scientist";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`privacy-screen ${player}`}
          initial={{ y: isScientist ? "100%" : "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: isScientist ? "100%" : "-100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onDismiss}
        >
          <div className="privacy-content">
            <div className="privacy-emoji">🙈</div>
            <p className="privacy-warning">{otherPlayer} player, look away!</p>
            <p className="privacy-instruction">{currentPlayer} player, tap to reveal your cards</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PrivacyScreen;
