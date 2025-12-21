function WelcomeSlide() {
  return (
    <div className="flex flex-col gap-4 leading-relaxed text-white/90">
      <h3 className="mb-2 text-center text-[1.25rem] tracking-widest text-white/80 uppercase">Choose your side</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-[rgba(74,138,74,0.4)] bg-[rgba(45,90,39,0.1)] px-4 py-5 text-center">
          <span className="block text-[3rem] md:text-[4rem]">🦖</span>
          <span className="block text-[1.5rem] font-bold text-[#90ee90]">Raptors</span>
          <p className="m-0 text-[0.9rem] text-white/70">A mother raptor and her 5 babies, fighting to escape.</p>

          <div className="mt-2 w-full border-t border-white/10 bg-transparent pt-3">
            <h4 className="mb-3 text-[0.9rem] tracking-[0.05em] text-[rgba(144,238,144,0.6)] uppercase">How to win</h4>
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[2.5rem] leading-none">🦎💨</span>
                <span className="text-white/80">3 babies escape</span>
              </div>
              <span className="text-[0.8rem] tracking-[0.05em] text-white/40 uppercase">or</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[2.5rem] leading-none">💀</span>
                <span className="text-white/80">Kill all scientists</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-[rgba(138,90,26,0.4)] bg-[rgba(138,90,26,0.1)] px-4 py-5 text-center">
          <span className="block text-[3rem] md:text-[4rem]">🧑‍🔬</span>
          <span className="block text-[1.5rem] font-bold text-[#ffb347]">Scientists</span>
          <p className="m-0 text-[0.9rem] text-white/70">A team of researchers hunting to capture the raptors.</p>

          <div className="mt-2 w-full border-t border-white/10 bg-transparent pt-3">
            <h4 className="mb-3 text-[0.9rem] tracking-[0.05em] text-[rgba(255,179,71,0.6)] uppercase">How to win</h4>
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[2.5rem] leading-none">🪤</span>
                <span className="text-white/80">Capture 3 babies</span>
              </div>
              <span className="text-[0.8rem] tracking-[0.05em] text-white/40 uppercase">or</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[2.5rem] leading-none">💉</span>
                <span className="text-white/80">Sedate the mother</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] bg-white/3 px-5 py-4">
        <h3 className="mb-3 text-[1rem] font-normal tracking-[0.05em] text-white/70 uppercase">
          What makes Raptor fun?
        </h3>
        <p className="m-0 text-[0.95rem] leading-relaxed text-white/80">
          This is a tense, tactical game of clever plays and daring comebacks. Plan your moves in secret, and anticipate
          your opponent to counter his strategy and maximize your own. Even when your opponent seems to have the upper
          hand, there are many ways to outwit him and turn the tide. Good luck!
        </p>
      </div>
    </div>
  );
}

export default WelcomeSlide;
