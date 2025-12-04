import "./App.css";
import { useReducer, useState } from "react";

import Board from "./Board.tsx";
import DevPanel from "./DevPanel.tsx";
import { GameContext } from "./state/GameContext.tsx";
import { gameReducer } from "./state/gameReducer.ts";
import { createInitialGameState } from "./types/gameState.ts";

function App() {
  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    createInitialGameState,
  );
  const [showCoordinates, setShowCoordinates] = useState(false);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <h1>Raptor Game</h1>
      <Board showCoordinates={showCoordinates} />
      <DevPanel
        showCoordinates={showCoordinates}
        onToggleCoordinates={setShowCoordinates}
      />
    </GameContext.Provider>
  );
}

export default App;
