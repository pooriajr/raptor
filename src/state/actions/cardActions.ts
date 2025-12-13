import type { GameState, CardState, Player } from "@/types/gameState.ts";
import type { CardInfo } from "@/data/cards.ts";
import { CARDS } from "@/data/cards.ts";
import { shuffleCards } from "@/utils/cardUtils.ts";

// Action types for card phase
export type CardAction = { type: "DRAW_CARDS"; player: "raptor" | "scientist" };

/**
 * Draw cards from deck to hand until hand has 3 cards.
 * If deck is empty and more cards needed, shuffle discard into deck first.
 *
 * Per rules:
 * - Each player draws a card to have three cards in hand
 * - If deck is empty, keep hand cards, shuffle all played cards to create new deck
 */
export function drawToHand(cardState: CardState): CardState {
  let { deck, discard } = cardState;
  const { hand } = cardState;

  const cardsNeeded = 3 - hand.length;
  if (cardsNeeded <= 0) {
    return cardState;
  }

  // If deck is empty but we have discard, shuffle discard into deck
  if (deck.length === 0 && discard.length > 0) {
    deck = shuffleCards(discard);
    discard = [];
  }

  // Still no cards available
  if (deck.length === 0) {
    return { ...cardState, deck, discard };
  }

  // Draw what we can
  const cardsToDraw = Math.min(cardsNeeded, deck.length);
  const newHand = [...hand, ...deck.slice(0, cardsToDraw)];
  const newDeck = deck.slice(cardsToDraw);

  // If we still need more cards and have discard remaining, shuffle and continue
  let result: CardState = {
    deck: newDeck,
    hand: newHand,
    discard,
  };

  // Recursively draw if we still need cards and shuffled discard into deck
  if (newHand.length < 3 && newDeck.length === 0 && discard.length > 0) {
    result = drawToHand(result);
  }

  return result;
}

/**
 * Move played card from hand to discard pile.
 * Called at end of round before drawing new cards.
 */
export function discardPlayedCard(cardState: CardState, playedCard: CardInfo | null): CardState {
  const { hand, discard, deck } = cardState;

  if (playedCard === null) {
    return cardState;
  }

  return {
    deck,
    hand: hand.filter((c) => c.id !== playedCard.id),
    discard: [...discard, playedCard],
  };
}

// Calculate round resolution from selected cards
// Lower card gets effect, higher card gets action points = difference
export function calculateRoundResolution(state: GameState): {
  activeEffectCard: CardInfo | null;
  actionPoints: number;
  activePlayer: Player | null;
} {
  const scientistCardId = state.scientistInteraction.selectedCard;
  const raptorCardId = state.raptorInteraction.selectedCard;

  if (scientistCardId === null || raptorCardId === null) {
    return { activeEffectCard: null, actionPoints: 0, activePlayer: null };
  }

  const scientistCard = CARDS[scientistCardId];
  const raptorCard = CARDS[raptorCardId];

  if (scientistCard.value === raptorCard.value) {
    return { activeEffectCard: null, actionPoints: 0, activePlayer: null };
  }

  if (scientistCard.value < raptorCard.value) {
    // Scientist has lower card - gets effect
    return {
      activeEffectCard: scientistCard,
      actionPoints: raptorCard.value - scientistCard.value,
      activePlayer: "scientist",
    };
  } else {
    // Raptor has lower card - gets effect
    return {
      activeEffectCard: raptorCard,
      actionPoints: scientistCard.value - raptorCard.value,
      activePlayer: "raptor",
    };
  }
}

/**
 * Shuffle discard pile into deck for a player.
 * Used when card 1 is played (both raptor and scientist card 1 have shuffle effect).
 */
export function shuffleDiscardIntoDeck(cardState: CardState): CardState {
  const { deck, hand, discard } = cardState;

  if (discard.length === 0) {
    return cardState;
  }

  // Combine deck and discard, then shuffle
  const newDeck = shuffleCards([...deck, ...discard]);

  return {
    deck: newDeck,
    hand,
    discard: [],
  };
}

// PLAYER_READY is now handled by ADVANCE_PHASE

export function handleDrawCards(state: GameState, action: { player: "raptor" | "scientist" }): GameState {
  if (action.player === "raptor") {
    return {
      ...state,
      raptorCards: drawToHand(state.raptorCards),
    };
  } else {
    return {
      ...state,
      scientistCards: drawToHand(state.scientistCards),
    };
  }
}

// Handler map for card actions
export const cardHandlers = {
  DRAW_CARDS: handleDrawCards,
};
