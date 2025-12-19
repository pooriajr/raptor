function WelcomeSlide() {
  return (
    <div className="slide-content intro-new">
      <h3 className="intro-choose-side">Choose your side</h3>

      <div className="intro-columns">
        <div className="intro-column raptor">
          <span className="intro-emoji-large">🦖</span>
          <span className="intro-role-large">Raptors</span>
          <p className="intro-desc">A mother raptor and her 5 babies, fighting to escape.</p>

          <div className="intro-section">
            <h4>How to win</h4>
            <div className="win-condition-visual">
              <div className="win-option">
                <span className="win-graphic">🦎💨</span>
                <span className="win-label">3 babies escape</span>
              </div>
              <span className="win-or">or</span>
              <div className="win-option">
                <span className="win-graphic">💀</span>
                <span className="win-label">Kill all scientists</span>
              </div>
            </div>
          </div>
        </div>

        <div className="intro-column scientist">
          <span className="intro-emoji-large">🧑‍🔬</span>
          <span className="intro-role-large">Scientists</span>
          <p className="intro-desc">A team of researchers hunting to capture the raptors.</p>

          <div className="intro-section">
            <h4>How to win</h4>
            <div className="win-condition-visual">
              <div className="win-option">
                <span className="win-graphic">🪤</span>
                <span className="win-label">Capture 3 babies</span>
              </div>
              <span className="win-or">or</span>
              <div className="win-option">
                <span className="win-graphic">💉</span>
                <span className="win-label">Sedate the mother</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="intro-section full-width">
        <h3>What makes Raptor fun?</h3>
        <p className="fun-text">
          This is a tense, tactical game of clever plays and daring comebacks. Plan your moves in secret, and
          anticipate your opponent to counter his strategy and maximize your own. Even when your opponent seems to have
          the upper hand, there are many ways to outwit him and turn the tide. Good luck!
        </p>
      </div>
    </div>
  );
}

export default WelcomeSlide;
