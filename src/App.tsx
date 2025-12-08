import "./App.css";
import { useReducer, useState } from "react";

import Board from "./Board.tsx";
import DevPanel from "./DevPanel.tsx";
import PlayerReadyScreen from "./PlayerReadyScreen.tsx";
import CardRevealOverlay from "./CardRevealOverlay.tsx";
import { GameContext } from "./state/GameContext.tsx";
import { gameReducer } from "./state/gameReducer.ts";
import { createInitialGameState } from "./types/gameState.ts";

function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialGameState);
  const [showCoordinates, setShowCoordinates] = useState(false);

  const handlePlayerReady = (player: "raptor" | "scientist") => {
    dispatch({ type: "PLAYER_READY", player });
  };

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <Board showCoordinates={showCoordinates} />
      <DevPanel showCoordinates={showCoordinates} onToggleCoordinates={setShowCoordinates} />
      {state.phase === "SCIENTIST_READY" && (
        <PlayerReadyScreen player="scientist" onReady={() => handlePlayerReady("scientist")} />
      )}
      {state.phase === "RAPTOR_READY" && (
        <PlayerReadyScreen player="raptor" onReady={() => handlePlayerReady("raptor")} />
      )}
      {state.phase === "CARD_REVEAL" && state.scientistCards.played !== null && state.raptorCards.played !== null && (
        <CardRevealOverlay
          scientistCard={state.scientistCards.played}
          raptorCard={state.raptorCards.played}
          onConfirm={() => dispatch({ type: "CONFIRM_REVEAL" })}
        />
      )}
    </GameContext.Provider>
  );
}

export default App;
