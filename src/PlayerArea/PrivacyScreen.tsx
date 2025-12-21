import { motion, AnimatePresence } from "framer-motion";

interface PrivacyScreenProps {
  player: "raptor" | "scientist";
  visible: boolean;
  onDismiss: () => void;
}

function PrivacyScreen({ player, visible, onDismiss }: PrivacyScreenProps) {
  const isScientist = player === "scientist";
  const currentPlayer = isScientist ? "Scientist" : "Raptor";
  const otherPlayer = isScientist ? "Raptor" : "Scientist";
  const screenClassName = [
    "absolute left-1/2 z-10 flex h-75 w-150 -translate-x-1/2 items-center justify-center cursor-pointer",
    isScientist
      ? "top-full -mt-66.25 rounded-t-[300px] bg-[rgba(45,25,10,0.7)] backdrop-blur-[10px]"
      : "bottom-full -mb-66.25 rounded-b-[300px] bg-[rgba(20,35,20,0.7)] backdrop-blur-[10px]",
  ].join(" ");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={screenClassName}
          initial={{ y: isScientist ? "100%" : "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: isScientist ? "100%" : "-100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onDismiss}
        >
          <div className="p-4 text-center">
            <div className="mb-2 text-[4rem]">🙈</div>
            <p className="mb-2 text-[1.1rem] font-bold tracking-[1px] text-[#ff6b6b] uppercase">
              {otherPlayer} player, look away!
            </p>
            <p className="text-[0.95rem] text-white/80">{currentPlayer} player, tap to reveal your cards</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PrivacyScreen;
