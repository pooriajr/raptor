import { createContext, useContext } from "react";
import type { GameState } from "../types/gameState.ts";
import type { GameAction } from "./gameReducer.ts";

export interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameContext.Provider");
  }
  return context;
}
