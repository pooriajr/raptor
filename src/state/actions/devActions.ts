import type { GameState } from "@/types/gameState.ts";
import { createInitialGameState } from "@/types/gameState.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";
import { CARDS, type CardId } from "@/data/cards.ts";

// Dev action types
export type DevAction =
  | { type: "DEV_SKIP_TO_EFFECT"; raptorCard: CardId; scientistCard: CardId }
  | { type: "DEV_SKIP_TO_ACTION"; player: "scientist" | "raptor" }
  | { type: "DEV_SKIP_TO_CARD_SELECTION"; player: "scientist" | "raptor" }
  | { type: "LOAD_GAME"; savedState: GameState }
  | { type: "RESET_GAME" };

// Dev helper: auto-setup pieces if none placed
function devAutoSetup(state: GameState): GameState {
  // Check if already set up (mother placed)
  if (state.mother.position !== null) return state;

  let newState = { ...state };
  const squareTiles = newState.tiles.filter((t) => t.shape === "square");
  const lTiles = newState.tiles.filter((t) => t.shape === "L");

  // Place mother on tile 2
  const tile2 = squareTiles.find((t) => t.id === 2)!;
  const motherSpace = tile2.spaces.find((s) => !s.hasMountain)!;
  newState = {
    ...newState,
    mother: {
      ...newState.mother,
      position: { tileId: 2, x: motherSpace.coordinate.x, y: motherSpace.coordinate.y },
    },
  };

  // Place babies on other square tiles
  const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
  const babyIds = Object.keys(newState.babies);
  const newBabies = { ...newState.babies };
  let babyIndex = 0;
  for (const tile of tilesForBabies) {
    if (babyIndex >= 5) break;
    const space = tile.spaces.find((s) => !s.hasMountain)!;
    const babyId = babyIds[babyIndex];
    newBabies[babyId] = {
      ...newBabies[babyId],
      position: { tileId: tile.id, x: space.coordinate.x, y: space.coordinate.y },
    };
    babyIndex++;
  }
  newState = {
    ...newState,
    babies: newBabies,
  };

  // Place scientists on L-tiles
  const scientistIds = Object.keys(newState.scientists);
  const scientists = { ...newState.scientists };
  for (let i = 0; i < 4 && i < lTiles.length; i++) {
    const tile = lTiles[i];
    const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
    scientists[scientistIds[i]] = {
      ...scientists[scientistIds[i]],
      position: { tileId: tile.id, x: space.coordinate.x, y: space.coordinate.y },
    };
  }
  newState = { ...newState, scientists };

  return newState;
}

export function handleDevSkipToEffect(
  state: GameState,
  action: { raptorCard: CardId; scientistCard: CardId },
): GameState {
  const setupState = devAutoSetup(state);
  const raptorCardInfo = CARDS[action.raptorCard];
  const scientistCardInfo = CARDS[action.scientistCard];
  const newState = {
    ...setupState,
    scientistCards: {
      ...setupState.scientistCards,
      played: scientistCardInfo,
      hand: setupState.scientistCards.hand.filter((c) => c.id !== action.scientistCard),
    },
    raptorCards: {
      ...setupState.raptorCards,
      played: raptorCardInfo,
      hand: setupState.raptorCards.hand.filter((c) => c.id !== action.raptorCard),
    },
  };
  return transitionToPhase(newState, "EFFECT_PHASE");
}

export function handleDevSkipToAction(state: GameState, action: { player: "scientist" | "raptor" }): GameState {
  const setupState = devAutoSetup(state);
  // For action phase: high card (9) gets action points, low card (1) gets effect
  // So to give a player action points, they need the higher card
  const raptorCardId: CardId = action.player === "raptor" ? "raptor_9_none" : "raptor_1_mothers_call";
  const scientistCardId: CardId = action.player === "scientist" ? "scientist_9_none" : "scientist_1_sleeping_gas";

  const newState = {
    ...setupState,
    scientistCards: {
      ...setupState.scientistCards,
      played: CARDS[scientistCardId],
      hand: setupState.scientistCards.hand.filter((c) => c.id !== scientistCardId),
    },
    raptorCards: {
      ...setupState.raptorCards,
      played: CARDS[raptorCardId],
      hand: setupState.raptorCards.hand.filter((c) => c.id !== raptorCardId),
    },
    actionPoints: 8,
  };
  return transitionToPhase(newState, "ACTION_PHASE");
}

export function handleDevSkipToCardSelection(state: GameState, action: { player: "scientist" | "raptor" }): GameState {
  const setupState = devAutoSetup(state);
  const phase = action.player === "scientist" ? "SCIENTIST_CARD_SELECTION" : "RAPTOR_CARD_SELECTION";

  const newState = {
    ...setupState,
    // Reset played cards for a fresh selection
    // If skipping to raptor selection, scientist has already played their first card
    scientistCards: {
      ...setupState.scientistCards,
      played: action.player === "raptor" ? (setupState.scientistCards.hand[0] ?? null) : null,
    },
    raptorCards: {
      ...setupState.raptorCards,
      played: null,
    },
  };
  return transitionToPhase(newState, phase);
}

export function handleLoadGame(_state: GameState, action: { savedState: GameState }): GameState {
  // Replace entire state with saved state
  return action.savedState;
}

export function handleResetGame(): GameState {
  // Reset to initial game state (main menu)
  return createInitialGameState();
}

// Handler map for dev actions
export const devHandlers = {
  DEV_SKIP_TO_EFFECT: handleDevSkipToEffect,
  DEV_SKIP_TO_ACTION: handleDevSkipToAction,
  DEV_SKIP_TO_CARD_SELECTION: handleDevSkipToCardSelection,
  LOAD_GAME: handleLoadGame,
  RESET_GAME: handleResetGame,
};
