import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Tutorial.css";
import "./Piece.css";
import { HandDisplay } from "./PlayerArea/Hand";
import { CARDS } from "./data/cards";
import { CardResolutionDisplay, EffectContent, ActionPointsContent } from "./CardResolution";

interface TutorialProps {
  onClose: () => void;
}

interface TutorialSlide {
  title: string;
  content: React.ReactNode;
}

// Space with permanent visible tooltip
function TooltipSpace({
  children,
  tooltip,
  className,
  tooltipPosition = "top",
}: {
  children?: React.ReactNode;
  tooltip: string;
  className: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <div className={`${className} has-tooltip`}>
      {children}
      <div className={`space-tooltip ${tooltipPosition}`}>{tooltip}</div>
    </div>
  );
}

// Full game board for tutorial - same size as actual game
function GameBoardFull() {
  return (
    <div className="tutorial-game-board-full">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="tutorial-exit-right" clipPathUnits="objectBoundingBox">
            <path d="M0.12,0 L0.65,0 L1,0.5 L0.65,1 L0.12,1 Q0,1 0,0.88 L0,0.12 Q0,0 0.12,0" />
          </clipPath>
          <clipPath id="tutorial-exit-left" clipPathUnits="objectBoundingBox">
            <path d="M0.88,0 L0.35,0 L0,0.5 L0.35,1 L0.88,1 Q1,1 1,0.88 L1,0.12 Q1,0 0.88,0" />
          </clipPath>
        </defs>
      </svg>

      {/* Row 1 */}
      <div className="board-full-row">
        {/* L-tile left (exit bottom/center) */}
        <div className="full-tile l-tile left">
          <div className="full-l-exit-col">
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
            <TooltipSpace
              className="full-space exit left"
              tooltip="Baby raptors escape via 4 exit spaces"
              tooltipPosition="top"
            />
          </div>
          <div className="full-l-main-col">
            <div className="full-space" />
            <div className="full-space" />
            <div className="full-space">
              <span>🦎</span>
            </div>
          </div>
        </div>

        {/* Square tile 1 */}
        <div className="full-tile square">
          <div className="full-space" />
          <TooltipSpace
            className="full-space mountain"
            tooltip="Mountains blocks movement and line of sight"
            tooltipPosition="top"
          >
            <span>⛰️</span>
          </TooltipSpace>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space">
            <span>🧑‍🔬</span>
          </div>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
        </div>

        {/* Square tile 2 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space">
            <span>🦎</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
        </div>

        {/* Square tile 3 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space" />
          <TooltipSpace className="full-space" tooltip="Babies try to escape via exits" tooltipPosition="top">
            <span>🦎</span>
          </TooltipSpace>
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space">
            <span>🧑‍🔬</span>
          </div>
          <TooltipSpace
            className="full-space fire"
            tooltip="Scientists set fires to blocks raptors"
            tooltipPosition="bottom"
          >
            <span>🔥</span>
          </TooltipSpace>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
        </div>

        {/* L-tile right (exit top) */}
        <div className="full-tile l-tile right">
          <div className="full-l-main-col">
            <div className="full-space fire">
              <span>🔥</span>
            </div>
            <div className="full-space fire">
              <span>🔥</span>
            </div>
            <div className="full-space" />
          </div>
          <div className="full-l-exit-col">
            <div className="full-space exit right" />
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="board-full-row">
        {/* L-tile left (exit top/center) */}
        <div className="full-tile l-tile left">
          <div className="full-l-exit-col">
            <div className="full-space exit left" />
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
          </div>
          <div className="full-l-main-col">
            <div className="full-space" />
            <div className="full-space" />
            <div className="full-space" />
          </div>
        </div>

        {/* Square tile 4 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <TooltipSpace
            className="full-space"
            tooltip="Sleeping babies are vulnerable to capture"
            tooltipPosition="left"
          >
            <span className="piece asleep">
              🦎<span className="status-icon">😴</span>
            </span>
          </TooltipSpace>
          <TooltipSpace
            className="full-space"
            tooltip="Scientists work together to capture babies"
            tooltipPosition="bottom"
          >
            <span>🧑‍🔬</span>
          </TooltipSpace>
          <TooltipSpace className="full-space" tooltip="Mother kills scientists and saves babies" tooltipPosition="top">
            <span className="mother-piece">🦖</span>
          </TooltipSpace>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
        </div>

        {/* Square tile 5 */}
        <div className="full-tile square">
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space">
            <span>🧑‍🔬</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
        </div>

        {/* Square tile 6 */}
        <div className="full-tile square">
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
          <div className="full-space">
            <span>🦎</span>
          </div>
          <div className="full-space" />
          <div className="full-space mountain">
            <span>⛰️</span>
          </div>
          <div className="full-space" />
          <div className="full-space" />
        </div>

        {/* L-tile right (exit bottom) */}
        <div className="full-tile l-tile right">
          <div className="full-l-main-col">
            <div className="full-space" />
            <div className="full-space" />
            <div className="full-space">
              <span>🧑‍🔬</span>
            </div>
          </div>
          <div className="full-l-exit-col">
            <div className="full-space-placeholder" />
            <div className="full-space-placeholder" />
            <div className="full-space exit right" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackerDisplay({
  emoji,
  filled,
  total,
  label,
}: {
  emoji: string;
  filled: number;
  total: number;
  label: string;
}) {
  return (
    <div className="tutorial-tracker">
      <span className="tracker-label">{label}</span>
      <div className="tracker-pips">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`tracker-pip ${i < filled ? "filled" : "empty"}`}>
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

const slides: TutorialSlide[] = [
  {
    title: "Welcome to Raptor",
    content: (
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
            anticipate your opponent to counter his strategy and maximize your own. Even when your opponent seems to
            have the upper hand, there are many ways to outwit him and turn the tide. Good luck!
          </p>
        </div>
      </div>
    ),
  },

  {
    title: "Game Elements",
    content: (
      <div className="slide-content board-overview-full">
        <GameBoardFull />
      </div>
    ),
  },
  {
    title: "How Rounds Work",
    content: (
      <div className="slide-content how-rounds-work">
        <div className="round-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Both players secretly choose a card from their hand</h4>
            <div className="step-hands">
              <HandDisplay
                player="raptor"
                cards={[CARDS.raptor_3_fear, CARDS.raptor_5_recovery, CARDS.raptor_8_fear]}
                selectedCardId="raptor_3_fear"
                static
                faceUp={false}
              />
              <HandDisplay
                player="scientist"
                cards={[CARDS.scientist_2_reinforcements, CARDS.scientist_6_reinforcements, CARDS.scientist_9_none]}
                selectedCardId="scientist_6_reinforcements"
                static
                faceUp={false}
              />
            </div>
          </div>
        </div>
        <div className="round-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Cards revealed — if tied, round ends with no effect</h4>
            <div className="step-hands">
              <HandDisplay player="raptor" cards={[CARDS.raptor_3_fear]} static />
              <HandDisplay player="scientist" cards={[CARDS.scientist_6_reinforcements]} static />
            </div>
          </div>
        </div>
        <div className="round-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Lower card uses its special effect</h4>
            <div className="step-resolution">
              <HandDisplay player="raptor" cards={[CARDS.raptor_3_fear]} static />
              <CardResolutionDisplay
                raptorContent={<EffectContent card={CARDS.raptor_3_fear} />}
                scientistContent={<ActionPointsContent actionPoints={3} animate={false} />}
                raptorState="active"
                scientistState="done"
                static
              />
              <div className="step-scribble">
                (The FEAR effect lets Raptor prevent 1 scientist piece from taking actions)
              </div>
            </div>
          </div>
        </div>
        <div className="round-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Higher card gets action points = difference</h4>
          </div>
        </div>
        <div className="round-step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h4>Discard played cards, draw back to 3</h4>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Raptor Actions",
    content: (
      <div className="slide-content raptor-actions">
        <h3>🦖 Mother Raptor (1 AP each)</h3>
        <div className="actions-grid">
          <div className="action-item">
            <span className="action-icon">➡️</span>
            <span className="action-text">Move in a straight line until blocked</span>
          </div>
          <div className="action-item">
            <span className="action-icon">💀</span>
            <span className="action-text">Kill adjacent scientist</span>
          </div>
          <div className="action-item">
            <span className="action-icon">⏰</span>
            <span className="action-text">Wake adjacent sleeping baby</span>
          </div>
          <div className="action-item">
            <span className="action-icon">💧</span>
            <span className="action-text">Extinguish adjacent fire</span>
          </div>
        </div>
        <h3>🦎 Baby Raptor (1 AP each)</h3>
        <div className="actions-grid">
          <div className="action-item">
            <span className="action-icon">↔️</span>
            <span className="action-text">Move one space orthogonally</span>
          </div>
          <div className="action-item">
            <span className="action-icon">🚪</span>
            <span className="action-text">Exit the board (if on exit space)</span>
          </div>
        </div>
        <p className="action-note">⚠️ Wounded mother must spend AP equal to sleep tokens before first move!</p>
      </div>
    ),
  },
  {
    title: "Scientist Actions",
    content: (
      <div className="slide-content scientist-actions">
        <h3>🧑‍🔬 Scientist Actions (1 AP each)</h3>
        <div className="actions-grid">
          <div className="action-item">
            <span className="action-icon">↔️</span>
            <span className="action-text">Move one space orthogonally</span>
          </div>
          <div className="action-item">
            <span className="action-icon">🧍</span>
            <span className="action-text">Stand up frightened scientist</span>
          </div>
          <div className="action-item">
            <span className="action-icon">😴</span>
            <span className="action-text">Put adjacent baby to sleep</span>
          </div>
          <div className="action-item">
            <span className="action-icon">🪤</span>
            <span className="action-text">Capture adjacent sleeping baby</span>
          </div>
          <div className="action-item aggressive">
            <span className="action-icon">🔫</span>
            <span className="action-text">Shoot mother (straight line, adds sleep token)</span>
          </div>
        </div>
        <p className="action-note">⚠️ Each scientist can only shoot OR capture once per round!</p>
      </div>
    ),
  },
  {
    title: "Raptor Card Effects",
    content: (
      <div className="slide-content card-effects raptor compact">
        <div className="effects-grid">
          <div className="effect-item">
            <span className="effect-value">1</span>
            <span className="effect-icon">📣</span>
            <span className="effect-text">Move 1 baby to mother (shuffles deck)</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">2</span>
            <span className="effect-icon">👁️</span>
            <span className="effect-text">Mother vanishes, see opponent's next card</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">3</span>
            <span className="effect-icon">😱</span>
            <span className="effect-text">Frighten 1 scientist</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">4</span>
            <span className="effect-icon">📣</span>
            <span className="effect-text">Move up to 2 babies to mother</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">5</span>
            <span className="effect-icon">💚</span>
            <span className="effect-text">Remove sleep tokens / wake babies (×2)</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">6</span>
            <span className="effect-icon">👁️</span>
            <span className="effect-text">Mother vanishes, see opponent's next card</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">7</span>
            <span className="effect-icon">💚</span>
            <span className="effect-text">Remove sleep tokens / wake babies (×3)</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">8</span>
            <span className="effect-icon">😱</span>
            <span className="effect-text">Frighten up to 2 scientists</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">9</span>
            <span className="effect-icon">⭕</span>
            <span className="effect-text">No effect (but high value = more AP!)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Scientist Card Effects",
    content: (
      <div className="slide-content card-effects scientist compact">
        <div className="effects-grid">
          <div className="effect-item">
            <span className="effect-value">1</span>
            <span className="effect-icon">💨</span>
            <span className="effect-text">Put 1 baby to sleep (shuffles deck)</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">2</span>
            <span className="effect-icon">🧑‍🔬</span>
            <span className="effect-text">Place 1-2 scientists from reserve</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">3</span>
            <span className="effect-icon">🚙</span>
            <span className="effect-text">2 straight-line moves, extinguishes fire</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">4</span>
            <span className="effect-icon">💨</span>
            <span className="effect-text">Put up to 2 babies to sleep</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">5</span>
            <span className="effect-icon">🔥</span>
            <span className="effect-text">Place 2 fire tokens (blocks raptors)</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">6</span>
            <span className="effect-icon">🧑‍🔬</span>
            <span className="effect-text">Place 1-2 scientists from reserve</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">7</span>
            <span className="effect-icon">🔥</span>
            <span className="effect-text">Place 3 fire tokens (blocks raptors)</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">8</span>
            <span className="effect-icon">🚙</span>
            <span className="effect-text">4 straight-line moves, extinguishes fire</span>
          </div>
          <div className="effect-item">
            <span className="effect-value">9</span>
            <span className="effect-icon">⭕</span>
            <span className="effect-text">No effect (but high value = more AP!)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Special Rules & Status",
    content: (
      <div className="slide-content special-and-status">
        <div className="rules-row">
          <div className="rule-box">
            <h4>🔥 Fire</h4>
            <p>Blocks raptors. Scientists walk through. Mother can extinguish.</p>
          </div>
          <div className="rule-box">
            <h4>⛰️ Mountains</h4>
            <p>Block all movement and shooting line of sight.</p>
          </div>
        </div>
        <div className="status-row">
          <div className="status-box">
            <span className="status-piece-small">
              🦎<span className="status-icon-small">😴</span>
            </span>
            <div>
              <strong>Sleeping Baby</strong>
              <p>Can't move. Can be captured. Wake with mother or Recovery.</p>
            </div>
          </div>
          <div className="status-box">
            <span className="status-piece-small">
              🧑‍🔬<span className="status-icon-small">😨</span>
            </span>
            <div>
              <strong>Frightened Scientist</strong>
              <p>Can't act. Another scientist can stand them up.</p>
            </div>
          </div>
          <div className="status-box">
            <TrackerDisplay emoji="💉" filled={3} total={5} label="" />
            <div>
              <strong>Sleep Tokens</strong>
              <p>5 tokens = scientists win! Costs AP to move.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Tips & Strategy",
    content: (
      <div className="slide-content tips">
        <div className="tips-section raptor">
          <h3>🦖 Raptor Tips</h3>
          <ul>
            <li>Keep babies spread out — harder to catch multiple</li>
            <li>Mother can kill scientists to thin their numbers</li>
            <li>Use Fear to disable key scientists</li>
            <li>Exit tiles are your goal — get babies there!</li>
          </ul>
        </div>
        <div className="tips-section scientist">
          <h3>🧑‍🔬 Scientist Tips</h3>
          <ul>
            <li>Sleep babies before capturing — you can't grab awake ones</li>
            <li>Fire creates barriers to control movement</li>
            <li>Shooting mother is powerful but reveals your position</li>
            <li>Work together — stand up frightened allies</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Ready to Play!",
    content: (
      <div className="slide-content ready">
        <div className="ready-content">
          <span className="ready-emoji">🎮</span>
          <p className="ready-text">You know the rules. Time to hunt... or be hunted.</p>
          <div className="ready-matchup">
            <span className="ready-piece">🦖</span>
            <span className="ready-vs">⚔️</span>
            <span className="ready-piece">🧑‍🔬</span>
          </div>
        </div>
      </div>
    ),
  },
];

function Tutorial({ onClose }: TutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="Tutorial">
      <div className="tutorial-container">
        <button className="tutorial-close" onClick={onClose}>
          ✕
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="tutorial-slide"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="tutorial-title">{slides[currentSlide].title}</h2>
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        <div className="tutorial-navigation">
          <button className="nav-button prev" onClick={prevSlide} disabled={isFirstSlide}>
            ← Previous
          </button>

          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slide-dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>

          {isLastSlide ? (
            <button className="nav-button start" onClick={onClose}>
              Start Playing →
            </button>
          ) : (
            <button className="nav-button next" onClick={nextSlide}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
