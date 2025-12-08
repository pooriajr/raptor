import type { GameState, CardState, Player } from "@/types/gameState.ts";

// Action types for card phase
export type CardAction =
  | { type: "PLAYER_READY"; player: "raptor" | "scientist" }
  | { type: "DRAW_CARDS"; player: "raptor" | "scientist" }
  | { type: "PLAY_CARD"; player: "raptor" | "scientist"; card: number }
  | { type: "CONFIRM_REVEAL" };

// Helper to draw cards from deck to hand (up to 3 cards in hand)
function drawCards(cardState: CardState): CardState {
  const cardsNeeded = 3 - cardState.hand.length;
  if (cardsNeeded <= 0 || cardState.deck.length === 0) {
    return cardState;
  }

  const cardsToDraw = Math.min(cardsNeeded, cardState.deck.length);
  const newHand = [...cardState.hand, ...cardState.deck.slice(0, cardsToDraw)];
  const newDeck = cardState.deck.slice(cardsToDraw);

  return {
    ...cardState,
    deck: newDeck,
    hand: newHand,
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

// Helper to transition to action phase with calculated AP
export function transitionToActionPhase(state: GameState): Partial<GameState> {
  const { actionPoints, activePlayer } = calculateActionPhaseState(state);
  return {
    phase: "ACTION_PHASE" as const,
    actionPoints,
    activePlayer,
  };
}

export function handlePlayerReady(state: GameState, action: { player: "raptor" | "scientist" }): GameState {
  if (action.player === "scientist" && state.phase === "SCIENTIST_READY") {
    return {
      ...state,
      phase: "SCIENTIST_CARD_SELECTION",
    };
  }
  if (action.player === "raptor" && state.phase === "RAPTOR_READY") {
    return {
      ...state,
      phase: "RAPTOR_CARD_SELECTION",
    };
  }
  return state;
}

export function handleDrawCards(state: GameState, action: { player: "raptor" | "scientist" }): GameState {
  if (action.player === "raptor") {
    return {
      ...state,
      raptorCards: drawCards(state.raptorCards),
    };
  } else {
    return {
      ...state,
      scientistCards: drawCards(state.scientistCards),
    };
  }
}

export function handlePlayCard(state: GameState, action: { player: "raptor" | "scientist"; card: number }): GameState {
  if (action.player === "scientist" && state.phase === "SCIENTIST_CARD_SELECTION") {
    // Remove card from hand and set as played
    const newHand = state.scientistCards.hand.filter((c) => c !== action.card);
    return {
      ...state,
      scientistCards: {
        ...state.scientistCards,
        hand: newHand,
        played: action.card,
      },
      phase: "RAPTOR_READY",
    };
  }
  if (action.player === "raptor" && state.phase === "RAPTOR_CARD_SELECTION") {
    // Remove card from hand and set as played
    const newHand = state.raptorCards.hand.filter((c) => c !== action.card);
    return {
      ...state,
      raptorCards: {
        ...state.raptorCards,
        hand: newHand,
        played: action.card,
      },
      phase: "CARD_REVEAL",
    };
  }
  return state;
}

export function handleConfirmReveal(state: GameState, _action: unknown): GameState {
  if (state.phase !== "CARD_REVEAL") return state;

  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;

  // If same cards, go to round end (nothing happens)
  if (scientistCard === raptorCard) {
    return { ...state, phase: "ROUND_END" };
  }

  // Lower card player uses their special effect first
  if (scientistCard !== null && raptorCard !== null) {
    return { ...state, phase: "EFFECT_PHASE" };
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
