import { useEffect, useRef, useState } from "react";
import { useGame } from "./state/GameContext";
import { hasSavedGame, loadGame } from "./utils/saveLoad";
import Tutorial from "./Tutorial/Tutorial";
import { playSfx } from "./audio/sfx";
import { registerAudioElement, setAudioMuted } from "./audio/audioSettings";
import { assetUrl } from "./utils/assetUrl";

function MainMenu() {
  const { dispatch } = useGame();
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const roarAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(assetUrl("sounds/drums-bg.mp3"));
    audio.loop = true;
    audio.volume = 0.5;
    menuAudioRef.current = audio;
    const unregisterMenuAudio = registerAudioElement(audio);

    const roarAudio = new Audio(assetUrl("sounds/big-roar.mp3"));
    roarAudio.volume = 0.9;
    roarAudioRef.current = roarAudio;
    const unregisterRoarAudio = registerAudioElement(roarAudio);

    return () => {
      unregisterRoarAudio();
      roarAudio.pause();
      roarAudio.currentTime = 0;
      roarAudioRef.current = null;
      unregisterMenuAudio();
      audio.pause();
      audio.currentTime = 0;
      menuAudioRef.current = null;
    };
  }, []);

  const handleNewGame = () => {
    playSfx("phase_start_game");
    dispatch({ type: "ADVANCE_PHASE" });
  };

  const handleLoadGame = () => {
    const savedState = loadGame();
    if (savedState) {
      dispatch({ type: "LOAD_GAME", savedState });
    }
  };

  const handleInitialStart = (muted: boolean) => {
    setAudioMuted(muted);
    setHasInteracted(true);
    void roarAudioRef.current?.play();
    void menuAudioRef.current?.play();
  };

  const savedGameExists = hasSavedGame();

  if (showTutorial) {
    return <Tutorial onClose={() => setShowTutorial(false)} />;
  }

  if (!hasInteracted) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-[linear-gradient(180deg,#171717_0%,#101010_100%)] px-6 text-white ">
        <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-8 py-10 sm:px-12 ">
          <div className="flex w-full max-w-md flex-col gap-5">
            <div className="flex items-start gap-4 text-left">
              <span aria-hidden="true" className="pt-1 text-[1.9rem] text-white/80 sm:text-[2.2rem]">
                💻
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-['Bungee'] text-[1.05rem] leading-none text-white sm:text-[1.25rem]">Laptop or Desktop Only</span>
                <p className="text-sm leading-relaxed text-white/72 sm:text-base">The game's layout won't work on a phone.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button
              className="flex items-center gap-4 rounded-full bg-white/12 px-8 py-4 text-[1rem] font-bold tracking-[0.08em] text-white transition-[transform,background-color,box-shadow] duration-200 hover:scale-105 hover:bg-white/16 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)] active:scale-95 sm:px-10 sm:text-[1.1rem]"
              onClick={() => handleInitialStart(false)}
              type="button"
            >
              <span aria-hidden="true" className="-ml-1 inline-flex w-7 justify-center text-[1.5rem] sm:w-8 sm:text-[1.7rem]">
                🔊
              </span>
              <span>Start with Audio</span>
            </button>
            <button
              className="flex items-center gap-4 rounded-full bg-white/8 px-8 py-4 text-[1rem] font-bold tracking-[0.08em] text-white/85 transition-[transform,background-color,box-shadow] duration-200 hover:scale-105 hover:bg-white/12 hover:text-white hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] active:scale-95 sm:px-10 sm:text-[1.1rem]"
              onClick={() => handleInitialStart(true)}
              type="button"
            >
              <span aria-hidden="true" className="-ml-1 inline-flex w-7 justify-center text-[1.5rem] sm:w-8 sm:text-[1.7rem]">
                🔇
              </span>
              <span>Start Muted</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[linear-gradient(135deg,#1a1a2e_0%,#16213e_50%,#0f3460_100%)]">
      <div className="p-12 text-center">
        <h1 className="mb-2 font-['Bungee'] text-[5rem] text-white [text-shadow:0_4px_8px_rgba(0,0,0,0.3)]">Raptor</h1>
        <p className="mb-12 text-[1.2rem] text-white/60">An asymmetrical game of tactics and trickery for 2 players</p>
        <div className="flex flex-col items-center gap-4">
          <button
            className="min-w-50 rounded-lg bg-[linear-gradient(145deg,#4a8a4a,#2a6a2a)] px-12 py-4 text-[1.2rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95"
            onClick={handleNewGame}
          >
            New Game
          </button>
          {savedGameExists && (
            <button
              className="min-w-50 rounded-lg bg-[linear-gradient(145deg,#4a6a8a,#2a4a6a)] px-12 py-4 text-[1.2rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95"
              onClick={handleLoadGame}
            >
              Continue
            </button>
          )}
          <button
            className="min-w-50 rounded-lg bg-[linear-gradient(145deg,#6a4a8a,#4a2a6a)] px-12 py-4 text-[1.2rem] font-bold text-white transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95"
            onClick={() => setShowTutorial(true)}
          >
            How to Play
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
