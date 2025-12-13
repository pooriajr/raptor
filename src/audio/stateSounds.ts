import type { GameState } from "@/types/gameState.ts";
import { playSfxLater } from "./sfx";

function handSize(state: GameState, player: "raptor" | "scientist"): number {
  return player === "raptor" ? state.raptorCards.hand.length : state.scientistCards.hand.length;
}

function discardSize(state: GameState, player: "raptor" | "scientist"): number {
  return player === "raptor" ? state.raptorCards.discard.length : state.scientistCards.discard.length;
}

function deckSize(state: GameState, player: "raptor" | "scientist"): number {
  return player === "raptor" ? state.raptorCards.deck.length : state.scientistCards.deck.length;
}

export function playSoundsForStateChange(prev: GameState, next: GameState): void {
  // Phase enter sounds (covers auto transitions too)
  if (prev.phase !== next.phase) {
    switch (next.phase) {
      case "CARD_REVEAL":
        playSfxLater("phase_enter_card_reveal", 0);
        break;
      case "EFFECT_PHASE":
        playSfxLater("phase_enter_effect", 0);
        break;
      case "ACTION_PHASE":
        playSfxLater("phase_enter_action", 0);
        break;
      case "ROUND_END":
        playSfxLater("phase_enter_round_end", 0);
        break;
      case "GAME_OVER":
        playSfxLater("phase_game_over", 0);
        break;
    }
  }

  // Card draws: play once per newly drawn card (staggered)
  for (const player of ["raptor", "scientist"] as const) {
    const delta = handSize(next, player) - handSize(prev, player);
    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        playSfxLater("cards_draw", i * 90);
      }
    }
  }

  // Discard: if discard pile grows, play once
  for (const player of ["raptor", "scientist"] as const) {
    const delta = discardSize(next, player) - discardSize(prev, player);
    if (delta > 0) {
      playSfxLater("cards_discard", 0);
      break;
    }
  }

  // Shuffle heuristic: discard emptied and deck grew
  for (const player of ["raptor", "scientist"] as const) {
    const prevDiscard = discardSize(prev, player);
    const nextDiscard = discardSize(next, player);
    const prevDeck = deckSize(prev, player);
    const nextDeck = deckSize(next, player);

    if (prevDiscard > 0 && nextDiscard === 0 && nextDeck > prevDeck) {
      playSfxLater("cards_shuffle", 0);
      break;
    }
  }
}
