import { useEffect, useReducer, useRef, useCallback } from "react";

import GameLayout from "./GameLayout.tsx";
import { GameContext } from "./state/GameContext.tsx";
import { RevealProvider } from "./RevealContext.tsx";
import { gameReducer } from "./state/gameReducer.ts";
import { createInitialGameState } from "./types/gameState.ts";
import { playSfx } from "./audio/sfx.ts";
import { getSoundForAction } from "./audio/actionSounds.ts";
import { playSoundsForStateChange } from "./audio/stateSounds.ts";
import type { GameAction } from "./state/gameReducer.ts";

function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialGameState);
  const prevStateRef = useRef(state);

  const dispatchWithSfx = useCallback(
    (action: GameAction) => {
      const sound = getSoundForAction(action, state);
      if (sound) playSfx(sound);
      dispatch(action);
    },
    [dispatch, state],
  );

  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== state) {
      playSoundsForStateChange(prev, state);
      prevStateRef.current = state;
    }
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch: dispatchWithSfx }}>
      <RevealProvider>
        <GameLayout />
      </RevealProvider>
    </GameContext.Provider>
  );
}

export default App;
