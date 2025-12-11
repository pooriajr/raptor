import { CARDS, type CardInfo } from "@/data/cards.ts";

// Cards filtered by player
export const raptorCards = Object.values(CARDS).filter((c) => c.player === "raptor");
export const scientistCards = Object.values(CARDS).filter((c) => c.player === "scientist");

// Shuffle an array of cards
export function shuffleCards(cards: CardInfo[]): CardInfo[] {
  const deck = [...cards];
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
