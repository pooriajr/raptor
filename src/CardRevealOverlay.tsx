import { useState, useEffect } from "react";
import Card from "./Card";
import { useGame } from "./state/GameContext";
import { CARDS, type CardInfo } from "@/data/cards.ts";

function CardRevealOverlay() {
  const { state, dispatch } = useGame();
  const [revealed, setRevealed] = useState(false);

  const scientistCardId = state.scientistInteraction.selectedCard;
  const raptorCardId = state.raptorInteraction.selectedCard;
  const scientistCard = scientistCardId ? CARDS[scientistCardId] : null;
  const raptorCard = raptorCardId ? CARDS[raptorCardId] : null;

  useEffect(() => {
    const timeout = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  // Both cards must be selected to show the reveal
  if (!scientistCard || !raptorCard) {
    return null;
  }

  const sameCards = scientistCard.value === raptorCard.value;
  const difference = Math.abs(scientistCard.value - raptorCard.value);
  const scientistWins = scientistCard.value < raptorCard.value;
  const winner = scientistWins ? "Scientist" : "Raptor";
  const actionPoints = `${difference} action point${difference > 1 ? "s" : ""}`;

  const renderEffectBox = (card: CardInfo, isWinner: boolean) => (
    <div
      className={`flex w-full max-w-80 flex-col items-center rounded-lg border bg-white/4 p-4 text-center ${
        isWinner ? "border-[#4a8a4a] text-white" : "border-white/10 text-white/80"
      }`}
    >
      <div className="mb-2 text-[0.8rem] tracking-[0.2em] text-white/60 uppercase">
        {card.player === "scientist" ? "Scientist" : "Raptor"}
      </div>
      <div className="text-[1rem]">{isWinner ? `Uses card effect: ${card.name}` : `Gets ${actionPoints}`}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-225 rounded-2xl border border-white/10 bg-[rgba(30,30,50,0.95)] p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <h2 className="mb-6 text-center font-['Bungee'] text-[2.5rem]">Card Reveal</h2>

        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="text-[0.95rem] tracking-[0.2em] text-[#ffb347] uppercase">Scientist</div>
            <div className="scale-90">
              <Card card={scientistCard} faceUp={revealed} />
            </div>
          </div>

          <div className="text-[1.5rem] font-bold text-white/50">VS</div>

          <div className="flex flex-col items-center gap-3">
            <div className="text-[0.95rem] tracking-[0.2em] text-[#90ee90] uppercase">Raptor</div>
            <div className="scale-90">
              <Card card={raptorCard} faceUp={revealed} />
            </div>
          </div>
        </div>

        {revealed && (
          <>
            {sameCards ? (
              <div className="mt-6 rounded-lg bg-white/4 p-4 text-center">
                <div className="text-[1.2rem] font-bold">Same Cards!</div>
                <div className="text-white/70">Nothing happens this round.</div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="flex w-full flex-wrap justify-center gap-4">
                  {renderEffectBox(scientistCard, scientistWins)}
                  {renderEffectBox(raptorCard, !scientistWins)}
                </div>
                <div className="text-[#ffd700]">{winner} acts first</div>
              </div>
            )}

            <button
              className="mt-6 rounded-lg bg-[linear-gradient(145deg,#4a8a4a,#2a6a2a)] px-10 py-3 text-[1rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_12px_rgba(74,138,74,0.4)] active:scale-95"
              onClick={() => dispatch({ type: "ADVANCE_PHASE" })}
            >
              {sameCards ? "End Round" : "Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CardRevealOverlay;
