import type { GameState } from "@/types/gameState";

const SAVE_KEY = "raptor-game-save";

/**
 * Save game state to localStorage
 */
export function saveGame(state: GameState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, serialized);
  } catch {
    // localStorage not available (e.g., in tests) or storage full
  }
}

/**
 * Load game state from localStorage
 * Returns null if no save exists or if save is invalid
 */
export function loadGame(): GameState | null {
  try {
    const serialized = localStorage.getItem(SAVE_KEY);
    if (!serialized) return null;

    const state = JSON.parse(serialized) as GameState;

    // Basic validation - check for required fields
    if (!state.phase || !state.tiles || !state.mother) {
      return null;
    }

    return state;
  } catch {
    // localStorage not available (e.g., in tests) or parse error
    return null;
  }
}

/**
 * Check if a saved game exists
 */
export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Delete saved game from localStorage
 */
export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // localStorage not available (e.g., in tests)
  }
}
