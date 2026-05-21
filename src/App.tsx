import { useEffect, useReducer, useRef, useCallback } from "react";

import GameLayout from "./GameLayout.tsx";
import { GameContext } from "./state/GameContext.tsx";
import { RevealProvider } from "./RevealContext.tsx";
import { gameReducer } from "./state/gameReducer.ts";
import { createInitialGameState } from "./types/gameState.ts";
import { playSfx } from "./audio/sfx.ts";
import { registerAudioElement } from "./audio/audioSettings.ts";
import { getSoundForAction } from "./audio/actionSounds.ts";
import { playSoundsForStateChange } from "./audio/stateSounds.ts";
import type { GameAction } from "./state/gameReducer.ts";
import { isPhase } from "./state/guards.ts";
import { assetUrl } from "./utils/assetUrl.ts";
import GlobalMuteButton from "./GlobalMuteButton.tsx";

function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialGameState);
  const prevStateRef = useRef(state);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambienceAudioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    const audio = new Audio(assetUrl("sounds/game-bg.mp3"));
    audio.loop = true;
    audio.volume = 0.4;
    gameAudioRef.current = audio;
    const unregisterGameAudio = registerAudioElement(audio);

    const ambienceAudio = new Audio(assetUrl("sounds/jungle-ambience-bg.mp3"));
    ambienceAudio.loop = true;
    ambienceAudio.volume = 0.15;
    ambienceAudioRef.current = ambienceAudio;
    const unregisterAmbienceAudio = registerAudioElement(ambienceAudio);

    return () => {
      unregisterAmbienceAudio();
      ambienceAudio.pause();
      ambienceAudio.currentTime = 0;
      ambienceAudioRef.current = null;
      unregisterGameAudio();
      audio.pause();
      audio.currentTime = 0;
      gameAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = gameAudioRef.current;
    const ambienceAudio = ambienceAudioRef.current;
    if (!audio || !ambienceAudio) return;

    if (isPhase(state, "MAIN_MENU")) {
      audio.pause();
      audio.currentTime = 0;
      ambienceAudio.pause();
      ambienceAudio.currentTime = 0;
      return;
    }

    const nextSrc = isPhase(state, "GAME_OVER") ? assetUrl("sounds/game-over-bg.mp3") : assetUrl("sounds/game-bg.mp3");

    if (audio.src !== `${window.location.origin}${nextSrc}`) {
      audio.src = nextSrc;
    }

    void audio.play().catch(() => {
      // Autoplay restrictions; should be resolved after user interaction.
    });

    if (isPhase(state, "GAME_OVER")) {
      ambienceAudio.pause();
      ambienceAudio.currentTime = 0;
      return;
    }

    const nextAmbienceSrc = assetUrl("sounds/jungle-ambience-bg.mp3");
    if (ambienceAudio.src !== `${window.location.origin}${nextAmbienceSrc}`) {
      ambienceAudio.src = nextAmbienceSrc;
    }

    void ambienceAudio.play().catch(() => {
      // Autoplay restrictions; should be resolved after user interaction.
    });
  }, [state.phase]);

  return (
    <GameContext.Provider value={{ state, dispatch: dispatchWithSfx }}>
      <RevealProvider>
        <GameLayout />
        <GlobalMuteButton />
      </RevealProvider>
    </GameContext.Provider>
  );
}

export default App;
