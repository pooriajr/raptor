import { useEffect, useState } from "react";
import { isAudioMuted, subscribeToAudioSettings, toggleAudioMuted } from "./audio/audioSettings";

function GlobalMuteButton() {
  const [muted, setMuted] = useState(isAudioMuted);

  useEffect(() => subscribeToAudioSettings(() => setMuted(isAudioMuted())), []);

  return (
    <button
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      className="fixed right-2 bottom-2 z-200 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-xl text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-[transform,background-color,opacity] duration-200 hover:scale-105 hover:bg-black/58 active:scale-95 sm:right-3 sm:bottom-3"
      onClick={toggleAudioMuted}
      type="button"
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}

export default GlobalMuteButton;
