import Card from "../Card";
import type { CardInfo } from "@/data/cards.ts";

interface DiscardPileProps {
  discardPile: CardInfo[];
}

function DiscardPile({ discardPile }: DiscardPileProps) {
  return (
    <div className="group/discard min-w-25 origin-center scale-[0.85] hover:z-100">
      {discardPile.length === 0 ? (
        <div className="flex h-52.5 w-37.5 items-center justify-center rounded-xl border-2 border-dashed border-[#555] text-[10px] text-[#666] uppercase">
          Discard
        </div>
      ) : (
        <div className="flex items-center">
          {discardPile.map((card) => (
            <div
              key={card.id}
              className="relative -ml-28.75 transition-transform duration-200 first:ml-0 group-hover/discard:nth-2:translate-x-15 group-hover/discard:nth-3:translate-x-30 group-hover/discard:nth-4:translate-x-45 group-hover/discard:nth-5:translate-x-60 group-hover/discard:nth-6:translate-x-75 group-hover/discard:nth-7:translate-x-90 group-hover/discard:nth-8:translate-x-105 group-hover/discard:nth-9:translate-x-120"
            >
              <Card card={card} faceUp layoutId={`card-${card.id}`} hideTooltip />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiscardPile;
