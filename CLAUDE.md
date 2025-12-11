# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + TypeScript + Vite implementation of **Raptor**, an asymmetric two-player board game designed by Bruno Cathala and Bruno Faidutti. The game features tactical combat between scientists and raptors on a hex-like board made of tiles.

## Game Rules Summary

### Win Conditions

**Raptor Player Wins:**

- Three baby raptors have escaped from the board, OR
- There are no more scientists on the board

**Scientist Player Wins:**

- Mother raptor has 5 sleep tokens (neutralizes her), OR
- Three baby raptors have been captured

### Core Mechanics

**Card-Based Action System**

- Each player has identical decks numbered 1-9
- Players hold 3 cards in hand, draw back to 3 after each round
- Card selection is sequential (scientist picks first, then raptor) since this is a single-screen game
- Cards revealed after both players have selected
- If cards match: no effect, round ends immediately
- If different values:
  - Lower card: Player uses that card's special action
  - Higher card: Player gets action points = difference between cards
  - The player who gets action points does NOT use their card's special action

**Board Structure**

- 6 square tiles (9 spaces each) form a 2×3 rectangle
- 4 L-shaped tiles (3 spaces + 1 exit half-space) attached to short sides
- Rocks placed on spaces without circles/half-circles
- Movement is orthogonal only (no diagonal movement or shooting)
- No space can have more than one figurine/token
- Half-spaces at exits are only for escaping baby raptors

### Raptor Player

**Mother Raptor Actions** (1 action point each):

- Move in straight orthogonal line until hitting obstacle (rock, fire, figurine)
- If wounded: Must spend action points = sleep tokens BEFORE first movement
- Kill adjacent scientist (removed from game, not returned to reserve)
- Wake up adjacent sleeping baby (not same round baby was put to sleep)
- Extinguish adjacent fire (removes that fire + all orthogonally connected fires)

**Baby Raptor Actions** (1 action point each):

- Move to adjacent space orthogonally
- If moved onto half-space exit: Baby escapes (removed from board)

**Raptor Card Effects:**

1. Mother's Call (1 baby) + Shuffle deck
2. Disappearance + Observation (remove mother, replace after opponent acts, see opponent's next card before choosing)
3. Fear (frighten 1 scientist)
4. Mother's Call (1-2 babies)
5. Recovery (×2: remove sleep tokens and/or wake babies)
6. Disappearance + Observation
7. Recovery (×3)
8. Fear (×2: frighten 1-2 scientists)
9. No effect

### Scientist Player

**Scientist Actions** (1 action point each):

- Move to adjacent space orthogonally
- Stand up frightened scientist (not same round frightened)
- Put adjacent baby to sleep
- Capture adjacent sleeping baby
- Shoot mother at range (orthogonal straight line, requires line of sight)

**IMPORTANT:** Each scientist can perform only ONE aggressive action per round (shoot or capture).

**Line of Sight for Shooting Mother:**

- Obstacles that BLOCK shooting: Rocks, Active (standing) scientists
- Can shoot THROUGH: Frightened scientists, fire tokens, baby raptors
- Shooting is orthogonal only, straight lines

**Scientist Card Effects:**

1. Sleeping Gas (1 baby on same/adjacent tile) + Shuffle deck
2. Reinforcements (1-2 scientists on long edges of square tiles only)
3. Jeep (×2 movements: straight line, extinguishes fires passed through)
4. Sleeping Gas (×2)
5. Fire (×2 tokens: adjacent to scientist or existing fire)
6. Reinforcements (1-2 scientists)
7. Fire (×3 tokens)
8. Jeep (×4 movements)
9. No effect

### Setup

**Scientists:** 4 on board (one per L-shaped tile), 6 in reserve, 10 total
**Raptors:** Mother on one central tile, 5 babies distributed (one per remaining tile)

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Type-check and build for production
npm run build

# Lint all files
npm run lint

# Run tests
npm test

# Run tests with UI
npm test:ui

# Preview production build
npm run preview
```

## Technical Stack

- **React 19** with TypeScript (strict mode)
- **Vite 7** for build tooling with Fast Refresh
- **Vitest** for testing
- **Framer Motion** for animations
- **Module Resolution**: ESNext with bundler mode
- **Styling**: Component-scoped CSS files

## Current Architecture

### State Management

- Single `GameState` object at App level via `useReducer`
- React Context (`GameContext`) provides state and dispatch to all components
- Phase-based state machine controls game flow
- Piece data stored as plain objects (`PieceState`); piece classes used for logic only
- Snapshot-revert pattern for undoable phases (effect and action)

### Components

- **App.tsx**: Root component, holds game state via `useReducer`, provides `GameContext`
- **Board.tsx**: Game board container, builds highlights map, dispatches actions
- **Tile.tsx**: Individual tile component with data attributes for styling
- **Space.tsx**: Individual space within a tile, renders pieces/fire/highlights
- **CardDeck.tsx**: Visual card deck display
- **Hand.tsx**: Player's hand of cards with selection UI
- **CardRevealOverlay.tsx**: Card reveal animation with effect/action point display
- **PlayerReadyScreen.tsx**: Screen shown between player turns
- **DevPanel.tsx**: Development tools for testing (auto-setup, skip to effects)
- **PlayerArea/**: Player-specific UI components (DoneButton, UndoButton, Tracker, etc.)

### State (`src/state/`)

- **gameReducer.ts**: Main reducer, dispatches to action handlers
- **GameContext.tsx**: React Context and `useGame()` hook for accessing state/dispatch
- **phaseTransition.ts**: Handles phase changes and snapshot management
- **actions/**: Action handlers organized by domain:
  - `setupActions.ts` - Piece placement during setup
  - `cardActions.ts` - Card selection and reveal
  - `effectActions.ts` - Effect phase actions (fear, sleeping gas, etc.)
  - `actionPhaseActions.ts` - Action phase actions (movement, attacks)
  - `roundActions.ts` - Round end logic
  - `interactionActions.ts` - UI state (selected actor, card selection)
  - `devActions.ts` - Development/debug actions

### Types (`src/types/`)

- **gameState.ts**: GameState, PieceState, CardState, FireToken, InteractionState
- **board.ts**: Coordinate, Space, SquareTile, LTile types + `createBoard()`
- **coordinates.ts**: Global coordinate system (localToGlobal, globalToLocal, adjacency)
- **highlights.ts**: SpaceHighlight, HighlightStyle types for board highlighting

### Utilities (`src/utils/`)

- **pathfinding.ts**: BFS pathfinding for Mother's Call, jeep destinations with paths
- **lineOfSight.ts**: Line of sight calculation for scientist shooting
- **effectUtils.ts**: Effect type lookup, effect player detection
- **cardEffects.ts**: Card effect name lookup
- **pieceUtils.ts**: Piece emoji helpers
- **fireUtils.ts**: Fire token utilities
- **boardUtils.ts**: Board space utilities
- **saveLoad.ts**: Game state persistence

### Pieces (`src/pieces/`)

Logic classes instantiated from `PieceState` for computing valid moves and actions.

- **Piece.ts**: Abstract base class with `getValidMoves(tiles, pieces, fireTokens)`, `clone()`
- **MotherRaptor.ts**: Mother raptor logic (emoji: 🦖)
- **BabyRaptor.ts**: Baby raptor logic (emoji: 🦎)
- **Scientist.ts**: Scientist logic with jeep mode support (emoji: 🧑‍🔬 or 🚙)

### Game Phases

```
RAPTOR_SETUP → SCIENTIST_SETUP → SCIENTIST_READY → SCIENTIST_CARD_SELECTION →
RAPTOR_READY → RAPTOR_CARD_SELECTION → CARD_REVEAL → EFFECT_PHASE → ACTION_PHASE →
MOTHER_RETURN (if applicable) → ROUND_END → back to SCIENTIST_READY
```

### Highlight System

Board.tsx builds a `SpaceHighlights` map that associates each space with:

- A visual style (e.g., `validMove`, `effectTarget`, `hostileTarget`)
- An optional action to dispatch on click

This enables declarative click handling - Space components just dispatch the action associated with their highlight.

**Highlight styles:**

- `validMove` - Action phase movement (green)
- `setupPlacement` / `setupMoveTarget` - Setup phase (light green)
- `effectTarget` - Selectable pieces for two-step effects (gold)
- `effectDestination` - Effect destinations (teal)
- `hostileTarget` - Enemy pieces that can be attacked (red)
- `friendlyTarget` - Friendly pieces/fire to interact with (purple)
- `fire` / `pendingFire` - Fire tokens (orange)
- `pathTrail` - Movement path indicators

### Snapshot-Revert Pattern

Both Effect Phase and Action Phase use a **snapshot-revert pattern** for undoable actions:

1. **On phase entry**: Save a snapshot of entire game state
2. **During phase**: Execute actions immediately (state updates right away)
3. **Track limits**: Use counters like `effectActionsRemaining` or `actionPoints`
4. **On confirm (Done)**: Discard the snapshot, proceed to next phase
5. **On revert (Undo)**: Restore the snapshot, resetting all changes

This keeps UI simple - components render actual state, no "pending" vs "real" distinction.

### Two-Step Effects

Mother's Call and Jeep use two-step selection via `selectedActorId`:

1. Click piece to select it (shows `effectTarget` highlight)
2. Click destination (shows `effectDestination` highlights for selected piece only)

## Current Progress

### Completed

- ✅ Board type system with Coordinate, Space, SquareTile, LTile
- ✅ Board generation with asymmetric L-tile exit configuration
- ✅ Visual board rendering with 10 tiles in correct positions
- ✅ Global coordinate system (localToGlobal, globalToLocal, adjacency)
- ✅ Piece classes (MotherRaptor, BabyRaptor, Scientist) with movement rules
- ✅ Setup phase with piece placement and validation
- ✅ Card selection UI (sequential: scientist picks, then raptor)
- ✅ Card reveal animation with Framer Motion
- ✅ **Effect Phase** - All card effects implemented with undo support
- ✅ **Action Phase** - All actions implemented:
  - Mother: move, kill scientist, wake baby, extinguish fire
  - Baby: move, escape via exit
  - Scientist: move, stand up, sleep baby, capture baby, shoot mother
- ✅ Line of sight calculation for scientist shooting
- ✅ Snapshot-revert pattern for both effect and action phases
- ✅ Two-step selection for Mother's Call and Jeep effects
- ✅ Win condition tracking (escapedBabies, capturedBabies, motherSleepTokens)
- ✅ Comprehensive test suite (145 tests)

### Next Steps

1. **Win condition UI** - Display game over screen when win conditions are met
2. **Observation mechanic** - After disappearance, see opponent's next card before choosing
3. **Recovery completion** - Remove sleep tokens from mother (currently only wakes babies)
4. **Deck shuffle** - Shuffle deck when cards 1 are played

### Technical Notes

- Tiles use local coordinates (0-2 for squares, 0-1 x-axis for L-tiles)
- Global coordinates span entire board for cross-tile movement
- L-tiles have "unusable" spaces (empty grid cells for layout)
- Exit spaces are only for baby raptor escapes
- Setup rules: Scientists on L-tiles (1 per tile), Mother on central tiles (2 or 7), Babies on remaining squares
- State lives in single GameState object at App level via useReducer
- Pieces in state are plain objects; piece classes encapsulate movement/action logic
- Phase-based state machine controls valid actions at each point
- `selectedActorId` is shared between action phase and effect phase for piece selection
