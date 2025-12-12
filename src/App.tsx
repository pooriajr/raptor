import "./App.css";
import { useReducer } from "react";

import GameLayout from "./GameLayout.tsx";
import { GameContext } from "./state/GameContext.tsx";
import { RevealProvider } from "./RevealContext.tsx";
import { gameReducer } from "./state/gameReducer.ts";
import { createInitialGameState } from "./types/gameState.ts";

function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialGameState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <RevealProvider>
        <GameLayout />
      </RevealProvider>
    </GameContext.Provider>
  );
}

export default App;
