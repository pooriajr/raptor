import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Tutorial.css";

interface TutorialProps {
  onClose: () => void;
}

interface TutorialSlide {
  title: string;
  content: React.ReactNode;
}

// Visual components for tutorial
function PieceDisplay({ emoji, label, size = "large" }: { emoji: string; label: string; size?: "large" | "medium" }) {
  return (
    <div className={`tutorial-piece ${size}`}>
      <span className="tutorial-piece-emoji">{emoji}</span>
      <span className="tutorial-piece-label">{label}</span>
    </div>
  );
}

function CardDisplay({
  value,
  player,
  name,
  icon,
}: {
  value: number;
  player: "raptor" | "scientist";
  name: string;
  icon: string;
}) {
  return (
    <div className={`tutorial-card ${player}`}>
      <div className="tutorial-card-value">{value}</div>
      <div className="tutorial-card-icon">{icon}</div>
      <div className="tutorial-card-name">{name}</div>
    </div>
  );
}

function ActionPointsDisplay({ low, high }: { low: number; high: number }) {
  return (
    <div className="tutorial-action-points">
      <div className="ap-calculation">
        <span className="ap-high">{high}</span>
        <span className="ap-minus">−</span>
        <span className="ap-low">{low}</span>
        <span className="ap-equals">=</span>
        <span className="ap-result">{high - low} Action Points</span>
      </div>
    </div>
  );
}

function SpaceDisplay({
  type,
  children,
}: {
  type: "normal" | "mountain" | "fire" | "exit";
  children?: React.ReactNode;
}) {
  return (
    <div className={`tutorial-space ${type}`}>
      {type === "mountain" && <span>⛰️</span>}
      {type === "fire" && <span>🔥</span>}
      {type === "exit" && <span className="exit-arrow">→</span>}
      {children}
    </div>
  );
}

function MiniBoard({ children }: { children: React.ReactNode }) {
  return <div className="tutorial-mini-board">{children}</div>;
}

// Full game board miniature for tutorial
function GameBoardMini() {
  // Simplified board representation matching actual game layout
  // 2 rows, each with: L-tile (left), 3 square tiles, L-tile (right)
  return (
    <div className="tutorial-game-board">
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
      <div className="board-mini-row">
        {/* L-tile left (exit top) */}
        <div className="mini-tile l-tile left">
          <div className="mini-l-exit-col">
            <div className="mini-space exit left" />
            <div className="mini-space-placeholder" />
            <div className="mini-space-placeholder" />
          </div>
          <div className="mini-l-main-col">
            <div className="mini-space">
              <span>🧑‍🔬</span>
            </div>
            <div className="mini-space" />
            <div className="mini-space" />
          </div>
        </div>

        {/* Square tile 1 */}
        <div className="mini-tile square">
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space">
            <span>🦎</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
        </div>

        {/* Square tile 2 (center-left, where mother can start) */}
        <div className="mini-tile square">
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space">
            <span>🦎</span>
          </div>
          <div className="mini-space">
            <span>🦖</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
        </div>

        {/* Square tile 3 */}
        <div className="mini-tile square">
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space">
            <span>🦎</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
        </div>

        {/* L-tile right (exit top) */}
        <div className="mini-tile l-tile right">
          <div className="mini-l-main-col">
            <div className="mini-space">
              <span>🧑‍🔬</span>
            </div>
            <div className="mini-space" />
            <div className="mini-space" />
          </div>
          <div className="mini-l-exit-col">
            <div className="mini-space exit right" />
            <div className="mini-space-placeholder" />
            <div className="mini-space-placeholder" />
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="board-mini-row">
        {/* L-tile left (exit bottom) */}
        <div className="mini-tile l-tile left">
          <div className="mini-l-exit-col">
            <div className="mini-space-placeholder" />
            <div className="mini-space-placeholder" />
            <div className="mini-space exit left" />
          </div>
          <div className="mini-l-main-col">
            <div className="mini-space" />
            <div className="mini-space" />
            <div className="mini-space">
              <span>🧑‍🔬</span>
            </div>
          </div>
        </div>

        {/* Square tile 4 */}
        <div className="mini-tile square">
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space">
            <span>🦎</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
        </div>

        {/* Square tile 5 */}
        <div className="mini-tile square">
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
        </div>

        {/* Square tile 6 */}
        <div className="mini-tile square">
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
          <div className="mini-space">
            <span>🦎</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space mountain">
            <span>⛰️</span>
          </div>
          <div className="mini-space" />
          <div className="mini-space" />
        </div>

        {/* L-tile right (exit bottom) */}
        <div className="mini-tile l-tile right">
          <div className="mini-l-main-col">
            <div className="mini-space" />
            <div className="mini-space" />
            <div className="mini-space">
              <span>🧑‍🔬</span>
            </div>
          </div>
          <div className="mini-l-exit-col">
            <div className="mini-space-placeholder" />
            <div className="mini-space-placeholder" />
            <div className="mini-space exit right" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WinCondition({
  player,
  condition,
  icon,
}: {
  player: "raptor" | "scientist";
  condition: string;
  icon: string;
}) {
  return (
    <div className={`tutorial-win-condition ${player}`}>
      <span className="win-icon">{icon}</span>
      <span className="win-text">{condition}</span>
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
      <div className="slide-content intro">
        <p className="intro-text">An asymmetric two-player game of survival and capture.</p>
        <div className="intro-matchup">
          <div className="intro-side raptor">
            <span className="intro-emoji">🦖</span>
            <span className="intro-role">Raptors</span>
            <span className="intro-goal">Help babies escape</span>
          </div>
          <span className="intro-vs">VS</span>
          <div className="intro-side scientist">
            <span className="intro-emoji">🧑‍🔬</span>
            <span className="intro-role">Scientists</span>
            <span className="intro-goal">Capture the raptors</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "The Pieces",
    content: (
      <div className="slide-content pieces">
        <div className="pieces-section raptor">
          <h3>Raptor Team</h3>
          <div className="pieces-row mother-row">
            <PieceDisplay emoji="🦖" label="Mother Raptor" />
          </div>
          <div className="pieces-row babies-row">
            <PieceDisplay emoji="🦎" label="" size="medium" />
            <PieceDisplay emoji="🦎" label="" size="medium" />
            <PieceDisplay emoji="🦎" label="" size="medium" />
            <PieceDisplay emoji="🦎" label="" size="medium" />
            <PieceDisplay emoji="🦎" label="" size="medium" />
          </div>
          <p className="pieces-count">1 Mother + 5 Baby Raptors</p>
        </div>
        <div className="pieces-section scientist">
          <h3>Scientist Team</h3>
          <div className="pieces-row scientists-row">
            <div className="scientists-on-board">
              <div className="scientist-group">
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
              </div>
              <span className="group-label">On Board</span>
            </div>
            <div className="scientists-reserve">
              <div className="scientist-group">
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
                <PieceDisplay emoji="🧑‍🔬" label="" size="medium" />
              </div>
              <span className="group-label">In Reserve</span>
            </div>
          </div>
          <p className="pieces-count">4 start on board + 6 in reserve = 10 total</p>
        </div>
      </div>
    ),
  },
  {
    title: "Win Conditions",
    content: (
      <div className="slide-content win-conditions">
        <div className="win-section raptor">
          <h3>🦖 Raptor Wins If:</h3>
          <WinCondition player="raptor" condition="3 babies escape the board" icon="🦎🦎🦎" />
          <WinCondition player="raptor" condition="All scientists are eliminated" icon="💀" />
        </div>
        <div className="win-section scientist">
          <h3>🧑‍🔬 Scientist Wins If:</h3>
          <WinCondition player="scientist" condition="3 babies are captured" icon="🦎🦎🦎" />
          <WinCondition player="scientist" condition="Mother has 5 sleep tokens" icon="💉💉💉💉💉" />
        </div>
      </div>
    ),
  },
  {
    title: "The Board",
    content: (
      <div className="slide-content board-overview">
        <GameBoardMini />
        <div className="board-legend">
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-icon">⛰️</span>
              <span>Mountains block movement</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon exit-icon">▶</span>
              <span>Exits for baby raptors to escape</span>
            </div>
          </div>
          <p className="board-setup-note">
            Scientists start on L-tiles. Mother starts in a central tile. Babies spread across square tiles.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Card Selection",
    content: (
      <div className="slide-content card-selection">
        <p className="selection-intro">Each round, both players secretly select a card from their hand of 3.</p>
        <div className="card-hands">
          <div className="hand raptor">
            <CardDisplay value={3} player="raptor" name="Fear" icon="😱" />
            <CardDisplay value={5} player="raptor" name="Recovery" icon="💚" />
            <CardDisplay value={8} player="raptor" name="Fear" icon="😱" />
          </div>
          <div className="hand scientist">
            <CardDisplay value={2} player="scientist" name="Reinforcements" icon="🧑‍🔬" />
            <CardDisplay value={5} player="scientist" name="Fire" icon="🔥" />
            <CardDisplay value={7} player="scientist" name="Fire" icon="🔥" />
          </div>
        </div>
        <p className="selection-note">Both players have cards numbered 1-9 with unique effects.</p>
      </div>
    ),
  },
  {
    title: "Card Resolution",
    content: (
      <div className="slide-content card-resolution">
        <p>When cards are revealed, compare the values:</p>
        <div className="resolution-cases">
          <div className="resolution-case tie">
            <h4>If cards match</h4>
            <div className="case-example">
              <CardDisplay value={5} player="raptor" name="Recovery" icon="💚" />
              <span className="vs">=</span>
              <CardDisplay value={5} player="scientist" name="Fire" icon="🔥" />
            </div>
            <p>Round ends immediately — no effects!</p>
          </div>
          <div className="resolution-case different">
            <h4>If cards differ</h4>
            <div className="case-example">
              <CardDisplay value={3} player="raptor" name="Fear" icon="😱" />
              <span className="vs">vs</span>
              <CardDisplay value={7} player="scientist" name="Fire" icon="🔥" />
            </div>
            <p>
              <strong>Lower card:</strong> Uses special effect (Fear 😱)
            </p>
            <p>
              <strong>Higher card:</strong> Gets action points (7 − 3 = 4 AP)
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Action Points",
    content: (
      <div className="slide-content action-points">
        <p>The player with the higher card gets action points equal to the difference.</p>
        <div className="ap-examples">
          <div className="ap-example">
            <div className="ap-cards">
              <CardDisplay value={2} player="raptor" name="Disappear" icon="👁️" />
              <CardDisplay value={8} player="scientist" name="Jeep" icon="🚙" />
            </div>
            <ActionPointsDisplay low={2} high={8} />
            <p>Raptor uses Disappearance effect</p>
            <p>Scientist gets 6 action points to spend</p>
          </div>
        </div>
        <p className="ap-note">Each action costs 1 point. Spend them wisely!</p>
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
      <div className="slide-content card-effects raptor">
        <div className="effects-list">
          <div className="effect-row">
            <CardDisplay value={1} player="raptor" name="Mother's Call" icon="📣" />
            <span className="effect-desc">Move 1 baby to mother (shuffles deck)</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={2} player="raptor" name="Disappearance" icon="👁️" />
            <span className="effect-desc">Mother vanishes, see opponent's next card</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={3} player="raptor" name="Fear" icon="😱" />
            <span className="effect-desc">Frighten 1 scientist (can't act until stood up)</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={4} player="raptor" name="Mother's Call" icon="📣" />
            <span className="effect-desc">Move up to 2 babies to mother</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={5} player="raptor" name="Recovery" icon="💚" />
            <span className="effect-desc">Remove sleep tokens / wake babies (×2)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Raptor Card Effects (cont.)",
    content: (
      <div className="slide-content card-effects raptor">
        <div className="effects-list">
          <div className="effect-row">
            <CardDisplay value={6} player="raptor" name="Disappearance" icon="👁️" />
            <span className="effect-desc">Mother vanishes, see opponent's next card</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={7} player="raptor" name="Recovery" icon="💚" />
            <span className="effect-desc">Remove sleep tokens / wake babies (×3)</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={8} player="raptor" name="Fear" icon="😱" />
            <span className="effect-desc">Frighten up to 2 scientists</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={9} player="raptor" name="No Effect" icon="⭕" />
            <span className="effect-desc">High value = more action points if you win!</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Scientist Card Effects",
    content: (
      <div className="slide-content card-effects scientist">
        <div className="effects-list">
          <div className="effect-row">
            <CardDisplay value={1} player="scientist" name="Sleeping Gas" icon="💨" />
            <span className="effect-desc">Put 1 baby to sleep (shuffles deck)</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={2} player="scientist" name="Reinforcements" icon="🧑‍🔬" />
            <span className="effect-desc">Place 1-2 scientists from reserve</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={3} player="scientist" name="Jeep" icon="🚙" />
            <span className="effect-desc">2 straight-line moves, extinguishes fire</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={4} player="scientist" name="Sleeping Gas" icon="💨" />
            <span className="effect-desc">Put up to 2 babies to sleep</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={5} player="scientist" name="Fire" icon="🔥" />
            <span className="effect-desc">Place 2 fire tokens (blocks raptors)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Scientist Card Effects (cont.)",
    content: (
      <div className="slide-content card-effects scientist">
        <div className="effects-list">
          <div className="effect-row">
            <CardDisplay value={6} player="scientist" name="Reinforcements" icon="🧑‍🔬" />
            <span className="effect-desc">Place 1-2 scientists from reserve</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={7} player="scientist" name="Fire" icon="🔥" />
            <span className="effect-desc">Place 3 fire tokens (blocks raptors)</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={8} player="scientist" name="Jeep" icon="🚙" />
            <span className="effect-desc">4 straight-line moves, extinguishes fire</span>
          </div>
          <div className="effect-row">
            <CardDisplay value={9} player="scientist" name="No Effect" icon="⭕" />
            <span className="effect-desc">High value = more action points if you win!</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Special Rules",
    content: (
      <div className="slide-content special-rules">
        <div className="rule-section">
          <h3>🔥 Fire</h3>
          <MiniBoard>
            <SpaceDisplay type="normal">
              <span>🧑‍🔬</span>
            </SpaceDisplay>
            <SpaceDisplay type="fire" />
            <SpaceDisplay type="fire" />
            <SpaceDisplay type="normal">
              <span>🦖</span>
            </SpaceDisplay>
          </MiniBoard>
          <p>
            Blocks mother and babies. Scientists can walk through. Mother can extinguish adjacent fires (removes
            connected group).
          </p>
        </div>
        <div className="rule-section">
          <h3>⛰️ Mountains</h3>
          <MiniBoard>
            <SpaceDisplay type="normal">
              <span>🦎</span>
            </SpaceDisplay>
            <SpaceDisplay type="mountain" />
            <SpaceDisplay type="normal">
              <span>🧑‍🔬</span>
            </SpaceDisplay>
          </MiniBoard>
          <p>Block all movement and line of sight for shooting.</p>
        </div>
      </div>
    ),
  },
  {
    title: "Status Effects",
    content: (
      <div className="slide-content status-effects">
        <div className="status-section">
          <h3>😴 Sleeping Baby</h3>
          <div className="status-display">
            <span className="status-piece">
              🦎<span className="status-icon">😴</span>
            </span>
          </div>
          <p>Cannot move. Can be captured by adjacent scientist. Mother or Recovery card can wake them.</p>
        </div>
        <div className="status-section">
          <h3>😨 Frightened Scientist</h3>
          <div className="status-display">
            <span className="status-piece">
              🧑‍🔬<span className="status-icon">😨</span>
            </span>
          </div>
          <p>Cannot move or act. Another scientist can stand them up. Does NOT block shots!</p>
        </div>
        <div className="status-section">
          <h3>💉 Mother's Sleep Tokens</h3>
          <TrackerDisplay emoji="💉" filled={3} total={5} label="" />
          <p>Each shot adds 1 token. At 5 tokens, scientists win! Mother must spend AP = tokens before moving.</p>
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

        <div className="slide-counter">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
