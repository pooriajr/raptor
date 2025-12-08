import "./App.css";
import { useReducer, useState, useEffect } from "react";

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

  // Determine the current active player based on game phase
  const getCurrentPlayer = (): "raptor" | "scientist" | null => {
    switch (state.phase) {
      case "RAPTOR_SETUP":
      case "RAPTOR_READY":
      case "RAPTOR_CARD_SELECTION":
        return "raptor";
      case "SCIENTIST_SETUP":
      case "SCIENTIST_READY":
      case "SCIENTIST_CARD_SELECTION":
        return "scientist";
      case "ACTION_PHASE":
      case "EFFECT_PHASE":
        return state.activePlayer;
      default:
        return null;
    }
  };

  // Apply background class to body based on active player
  useEffect(() => {
    const player = getCurrentPlayer();
    document.body.classList.remove("active-raptor", "active-scientist");
    if (player) {
      document.body.classList.add(`active-${player}`);
    }
  }, [state.phase, state.activePlayer]);

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
