import type { GameState, CardState, Player } from "@/types/gameState.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";

// Action types for card phase
export type CardAction =
  | { type: "PLAYER_READY"; player: "raptor" | "scientist" }
  | { type: "DRAW_CARDS"; player: "raptor" | "scientist" }
  | { type: "PLAY_CARD"; player: "raptor" | "scientist"; card: number }
  | { type: "CONFIRM_REVEAL" };

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Draw cards from deck to hand until hand has 3 cards.
 * If deck is empty and more cards needed, shuffle discard into deck first.
 *
 * Per rules:
 * - Each player draws a card to have three cards in hand
 * - If deck is empty, keep hand cards, shuffle all played cards to create new deck
 */
export function drawToHand(cardState: CardState): CardState {
  let { deck, hand, discard, played } = cardState;

  const cardsNeeded = 3 - hand.length;
  if (cardsNeeded <= 0) {
    return cardState;
  }

  // If deck is empty but we have discard, shuffle discard into deck
  if (deck.length === 0 && discard.length > 0) {
    deck = shuffleArray(discard);
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
    played,
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
export function discardPlayedCard(cardState: CardState): CardState {
  const { hand, played, discard, deck } = cardState;

  if (played === null) {
    return cardState;
  }

  return {
    deck,
    hand: hand.filter((c) => c !== played),
    played: null,
    discard: [...discard, played],
  };
}

// Calculate action points and active player from played cards
// Higher card gets action points = difference between cards
export function calculateActionPhaseState(state: GameState): {
  actionPoints: number;
  activePlayer: Player | null;
} {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;

  if (scientistCard === null || raptorCard === null) {
    return { actionPoints: 0, activePlayer: null };
  }

  if (scientistCard === raptorCard) {
    return { actionPoints: 0, activePlayer: null };
  }

  if (scientistCard > raptorCard) {
    return {
      actionPoints: scientistCard - raptorCard,
      activePlayer: "scientist",
    };
  } else {
    return {
      actionPoints: raptorCard - scientistCard,
      activePlayer: "raptor",
    };
  }
}

/**
 * Shuffle discard pile into deck for a player.
 * Used when card 1 is played (both raptor and scientist card 1 have shuffle effect).
 */
export function shuffleDiscardIntoDeck(cardState: CardState): CardState {
  const { deck, hand, discard, played } = cardState;

  if (discard.length === 0) {
    return cardState;
  }

  // Combine deck and discard, then shuffle
  const newDeck = shuffleArray([...deck, ...discard]);

  return {
    deck: newDeck,
    hand,
    played,
    discard: [],
  };
}

// Helper to transition to action phase with calculated AP
// Also handles card 1 shuffle effect for the player who used the effect
export function getActionPhaseState(state: GameState): Partial<GameState> {
  const { actionPoints, activePlayer } = calculateActionPhaseState(state);

  // Check if card 1 was played and got the effect (lower card gets effect)
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;

  let scientistCards = state.scientistCards;
  let raptorCards = state.raptorCards;

  if (scientistCard !== null && raptorCard !== null) {
    // Scientist played card 1 and got the effect (scientist card lower)
    if (scientistCard === 1 && scientistCard < raptorCard) {
      scientistCards = shuffleDiscardIntoDeck(scientistCards);
    }
    // Raptor played card 1 and got the effect (raptor card lower)
    if (raptorCard === 1 && raptorCard < scientistCard) {
      raptorCards = shuffleDiscardIntoDeck(raptorCards);
    }
  }

  return {
    actionPoints,
    activePlayer,
    scientistCards,
    raptorCards,
  };
}

export function handlePlayerReady(state: GameState, action: { player: "raptor" | "scientist" }): GameState {
  if (action.player === "scientist" && state.phase === "SCIENTIST_READY") {
    return transitionToPhase(state, "SCIENTIST_CARD_SELECTION");
  }
  if (action.player === "raptor" && state.phase === "RAPTOR_READY") {
    return transitionToPhase(state, "RAPTOR_CARD_SELECTION");
  }
  return state;
}

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

export function handlePlayCard(state: GameState, action: { player: "raptor" | "scientist"; card: number }): GameState {
  if (action.player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") {
    // Mark card as played (keep in hand until explicitly removed later)
    const newState = {
      ...state,
      scientistCards: {
        ...state.scientistCards,
        played: action.card,
      },
    };
    return transitionToPhase(newState, "RAPTOR_READY");
  }
  if (action.player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION") {
    // Mark card as played (keep in hand until explicitly removed later)
    // Also reset observation - raptor has seen the card and made their choice
    const newState = {
      ...state,
      raptorCards: {
        ...state.raptorCards,
        played: action.card,
      },
      observationActive: false,
    };
    return transitionToPhase(newState, "CARD_REVEAL");
  }
  return state;
}

export function handleConfirmReveal(state: GameState): GameState {
  if (state.phase !== "CARD_REVEAL") return state;

  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;

  // If same cards, go to round end (nothing happens)
  if (scientistCard === raptorCard) {
    return transitionToPhase(state, "ROUND_END");
  }

  // Lower card player uses their special effect first
  if (scientistCard !== null && raptorCard !== null) {
    return transitionToPhase(state, "EFFECT_PHASE");
  }

  return state;
}

// Handler map for card actions
export const cardHandlers = {
  PLAYER_READY: handlePlayerReady,
  DRAW_CARDS: handleDrawCards,
  PLAY_CARD: handlePlayCard,
  CONFIRM_REVEAL: handleConfirmReveal,
};
