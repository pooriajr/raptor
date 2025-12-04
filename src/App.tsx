import "./App.css";
import { useReducer } from "react";

import Board from "./Board.tsx";
import SetupIndicator from "./SetupIndicator.tsx";
import { GameContext } from "./state/GameContext.tsx";
import { gameReducer } from "./state/gameReducer.ts";
import { createInitialGameState } from "./types/gameState.ts";

function App() {
  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    createInitialGameState,
  );

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <h1>Raptor Game</h1>
      <SetupIndicator />
      <Board />
    </GameContext.Provider>
  );
}

export default App;
