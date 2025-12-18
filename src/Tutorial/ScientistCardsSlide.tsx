import { useState } from "react";
import { HandDisplay } from "../PlayerArea/Hand";
import { CARDS, type CardId } from "@/data/cards";

const SCIENTIST_CARD_PAIRS: Array<[CardId, CardId]> = [
  ["scientist_1_sleeping_gas", "scientist_4_sleeping_gas"],
  ["scientist_2_reinforcements", "scientist_6_reinforcements"],
  ["scientist_3_jeep", "scientist_8_jeep"],
  ["scientist_5_fire", "scientist_7_fire"],
];

function CardEffectRow({ cards }: { cards: [CardId, CardId] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lowerCardId, higherCardId] = cards;
  const lowerCard = CARDS[lowerCardId];
  const higherCard = CARDS[higherCardId];

  const selectedCard = selectedIndex === 0 ? lowerCard : higherCard;

  return (
    <div className="flex items-center gap-8 py-3 pl-6 border-b border-white/10 last:border-b-0">
      <div className="shrink-0 w-[230px] flex justify-center">
        <div className="scale-75">
          <HandDisplay
            player="scientist"
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
        <h4 className="text-lg font-bold text-[#ffcc80] mb-1 flex items-center gap-2">
          <span>{selectedCard.icon}</span>
          {selectedCard.name}
          {selectedCard.effectCount > 1 && (
            <span className="text-sm font-normal text-white/60">(×{selectedCard.effectCount})</span>
          )}
        </h4>
        <p className="text-sm text-white/80 leading-relaxed">{selectedCard.description}</p>
      </div>
    </div>
  );
}

function Card9Row() {
  const card9 = CARDS.scientist_9_none;

  return (
    <div className="flex items-center gap-8 py-3 pl-6">
      <div className="shrink-0 w-[230px] flex justify-center">
        <div className="scale-75">
          <HandDisplay
            player="scientist"
            cards={[card9]}
            selectedCardId={card9.id}
            skipEntryAnimation
            hideTooltips
            staticFan
          />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-lg font-bold text-[#ffcc80] mb-1 flex items-center gap-2">
          <span>{card9.icon}</span>
          {card9.name}
        </h4>
        <p className="text-sm text-white/80 leading-relaxed">{card9.description}</p>
      </div>
    </div>
  );
}

function ScientistCardsSlide() {
  return (
    <div className="flex flex-col">
      {SCIENTIST_CARD_PAIRS.map((cards) => (
        <CardEffectRow key={cards[0]} cards={cards} />
      ))}
      <Card9Row />
    </div>
  );
}

export default ScientistCardsSlide;
