import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "./Card";
import { useGame } from "./state/GameContext";
import { useReveal } from "./RevealContext";
import { CARDS } from "@/data/cards.ts";
import "./CardReveal.css";

type AnimationStage = "flying-in" | "pausing" | "show-effect" | "show-action-points" | "flying-out" | "complete";

function CardReveal() {
  const { state, dispatch } = useGame();
  const { setStage: setRevealStage, setEffectPlayer } = useReveal();
  const [stage, setStage] = useState<AnimationStage>("flying-in");

  // Get the selected cards
  const scientistCardId = state.scientistInteraction.selectedCard;
  const raptorCardId = state.raptorInteraction.selectedCard;
  const scientistCard = scientistCardId ? CARDS[scientistCardId] : null;
  const raptorCard = raptorCardId ? CARDS[raptorCardId] : null;

  // Calculate winner/loser
  const isTied = scientistCard?.value === raptorCard?.value;
  const scientistWins = scientistCard && raptorCard && scientistCard.value < raptorCard.value;

  // Set effect player in context when entering show-effect stage
  // The player with the lower card gets the effect
  useEffect(() => {
    if (stage === "show-effect" && !isTied) {
      setEffectPlayer(scientistWins ? "scientist" : "raptor");
    } else if (stage === "complete" || stage === "flying-in") {
      setEffectPlayer(null);
    }
  }, [stage, isTied, scientistWins, setEffectPlayer]);

  // Stage transitions
  useEffect(() => {
    if (!scientistCard || !raptorCard) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const scheduleStage = (nextStage: AnimationStage, delay: number) => {
      timers.push(setTimeout(() => setStage(nextStage), delay));
    };

    switch (stage) {
      case "flying-in":
        setRevealStage("cards-center");
        scheduleStage("pausing", 400);
        break;

      case "pausing":
        // Cards are in the center, pause briefly
        if (isTied) {
          scheduleStage("flying-out", 1000);
        } else {
          scheduleStage("show-effect", 500);
        }
        break;

      case "show-effect":
        // Smaller card (winner) grows, bigger card dims
        // Effect half of CardResolution becomes visible
        setRevealStage("show-effect");
        scheduleStage("show-action-points", 1000);
        break;

      case "show-action-points":
        // Bigger card (loser) grows, smaller card dims
        // AP half of CardResolution becomes visible
        setRevealStage("show-ap");
        scheduleStage("flying-out", 1000);
        break;

      case "flying-out":
        // Both cards return to normal and fly to discard
        setRevealStage("complete");
        scheduleStage("complete", 400);
        break;

      case "complete":
        setRevealStage("hidden");
        dispatch({ type: "ADVANCE_PHASE" });
        break;
    }

    return () => timers.forEach(clearTimeout);
  }, [stage, scientistCard, raptorCard, isTied, setRevealStage, dispatch]);

  if (!scientistCard || !raptorCard) {
    return null;
  }

  // Determine card states based on stage
  const getCardState = (isWinner: boolean) => {
    if (stage === "show-effect") {
      return isWinner ? "selected" : "dimmed";
    }
    if (stage === "show-action-points") {
      return isWinner ? "dimmed" : "selected";
    }
    return "normal";
  };

  const scientistState = getCardState(!!scientistWins);
  const raptorState = getCardState(!scientistWins);

  return (
    <div className="CardReveal">
      <div className="overlay" />
      {/* Cards */}
      <div className="reveal-cards">
        <motion.div
          className="reveal-card scientist-card"
          animate={{
            scale: scientistState === "selected" ? 1.15 : scientistState === "dimmed" ? 0.9 : 1,
          }}
          transition={{ duration: 0.4 }}
        >
          <Card
            card={scientistCard}
            faceUp={stage !== "flying-in"}
            hideTooltip
            selected={scientistState === "selected"}
            dimmed={scientistState === "dimmed"}
            layoutId={`card-${scientistCard.id}`}
          />
        </motion.div>

        <motion.div
          className="reveal-card raptor-card"
          animate={{
            scale: raptorState === "selected" ? 1.15 : raptorState === "dimmed" ? 0.9 : 1,
          }}
          transition={{ duration: 0.4 }}
        >
          <Card
            card={raptorCard}
            faceUp={stage !== "flying-in"}
            hideTooltip
            selected={raptorState === "selected"}
            dimmed={raptorState === "dimmed"}
            layoutId={`card-${raptorCard.id}`}
          />
        </motion.div>
      </div>

      {/* Tied message */}
      {isTied && stage === "pausing" && (
        <motion.div
          className="tied-message"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          Tied! Round ends.
        </motion.div>
      )}
    </div>
  );
}

export default CardReveal;
