import { useState } from "react";
import { HandDisplay } from "../PlayerArea/Hand";
import { CARDS, type CardId } from "@/data/cards";

const RAPTOR_CARD_PAIRS: Array<[CardId, CardId]> = [
  ["raptor_1_mothers_call", "raptor_4_mothers_call"],
  ["raptor_2_disappearance", "raptor_6_disappearance"],
  ["raptor_3_fear", "raptor_8_fear"],
  ["raptor_5_recovery", "raptor_7_recovery"],
];

function CardEffectRow({ cards }: { cards: [CardId, CardId] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lowerCardId, higherCardId] = cards;
  const lowerCard = CARDS[lowerCardId];
  const higherCard = CARDS[higherCardId];

  const selectedCard = selectedIndex === 0 ? lowerCard : higherCard;

  return (
    <div className="flex items-center gap-8 border-b border-white/10 py-3 pl-6 last:border-b-0">
      <div className="flex w-57.5 shrink-0 justify-center">
        <div className="scale-75">
          <HandDisplay
            player="raptor"
            cards={[lowerCard, higherCard]}
            selectedCardId={selectedIndex === 0 ? lowerCardId : higherCardId}
            onCardSelect={(cardId) => setSelectedIndex(cardId === lowerCardId ? 0 : 1)}
            skipEntryAnimation
            hideTooltips
            staticFan
          />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="mb-1 flex items-center gap-2 text-lg font-bold text-[#90ee90]">
          <span>{selectedCard.icon}</span>
          {selectedCard.name}
          {selectedCard.effectCount > 1 && (
            <span className="text-sm font-normal text-white/60">(×{selectedCard.effectCount})</span>
          )}
        </h4>
        <p className="text-sm leading-relaxed text-white/80">{selectedCard.description}</p>
      </div>
    </div>
  );
}

function Card9Row({ player }: { player: "raptor" | "scientist" }) {
  const card9 = player === "raptor" ? CARDS.raptor_9_none : CARDS.scientist_9_none;
  const titleColor = player === "raptor" ? "text-[#90ee90]" : "text-[#ffcc80]";

  return (
    <div className="flex items-center gap-8 py-3 pl-6">
      <div className="flex w-57.5 shrink-0 justify-center">
        <div className="scale-75">
          <HandDisplay
            player={player}
            cards={[card9]}
            selectedCardId={card9.id}
            skipEntryAnimation
            hideTooltips
            staticFan
          />
        </div>
      </div>
      <div className="flex-1">
        <h4 className={`text-lg font-bold ${titleColor} mb-1 flex items-center gap-2`}>
          <span>{card9.icon}</span>
          {card9.name}
        </h4>
        <p className="text-sm leading-relaxed text-white/80">{card9.description}</p>
      </div>
    </div>
  );
}

function RaptorCardsSlide() {
  return (
    <div className="flex flex-col">
      {RAPTOR_CARD_PAIRS.map((cards) => (
        <CardEffectRow key={cards[0]} cards={cards} />
      ))}
      <Card9Row player="raptor" />
    </div>
  );
}

export default RaptorCardsSlide;
