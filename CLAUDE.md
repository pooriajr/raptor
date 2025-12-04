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
- **Module Resolution**: ESNext with bundler mode
- **Styling**: Component-scoped CSS files

## Current Architecture

See **ARCHITECTURE.md** for detailed state management design.

### State Management

- Single `GameState` object at App level via `useReducer`
- React Context (`GameContext`) provides state and dispatch to all components
- Phase-based state machine controls game flow
- Piece data stored as plain objects (`PieceState`); piece classes used for logic only

### Components

- **App.tsx**: Root component, holds game state via `useReducer`, provides `GameContext`
- **Board.tsx**: Game board container, uses `useGame()` hook, dispatches actions for piece placement
- **Tile.tsx**: Individual tile component with data attributes for styling
- **HoldingPen.tsx**: Displays pieces available for placement during setup (draggable)

### State (`src/state/`)

- **gameReducer.ts**: Handles all state changes via actions (PLACE_SCIENTIST, PLACE_MOTHER, PLACE_BABY, MOVE_PIECE)
- **GameContext.tsx**: React Context and `useGame()` hook for accessing state/dispatch

### Types (`src/types/`)

- **gameState.ts**: GameState, PieceState, HoldingPen types + `createInitialGameState()`
- **board.ts**: Coordinate, Space, SquareTile, LTile types + `createBoard()` returns `Tile[]`
- **coordinates.ts**: Global coordinate system (localToGlobal, globalToLocal, adjacency)

### Pieces (`src/pieces/`)

Logic classes instantiated from `PieceState` for computing valid moves and actions.

- **Piece.ts**: Abstract base class with `getValidMoves(tiles, pieces)`, `clone()`
- **MotherRaptor.ts**: Mother raptor logic (emoji: 🦖)
- **BabyRaptor.ts**: Baby raptor logic (emoji: 🦎)
- **Scientist.ts**: Scientist logic with jeep mode support (emoji: 🧑‍🔬 or 🚙)

### Board Generation Logic

- 10 tiles total: 6 square tiles (IDs 1-3, 6-8) + 4 L-tiles (IDs 0, 4, 5, 9)
- L-tiles positioned at corners: 0 (top-left), 4 (top-right), 5 (bottom-left), 9 (bottom-right)
- Two asymmetric configurations:
  - **Spread**: One side has exits at top and bottom (C-shape)
  - **Clustered**: Other side has exits in middle rows
- Exits always point away from board center
- 21 passing tests validate all board generation rules

### Styling

- **Board.css**: 5-column, 2-row grid layout
- **Tile.css**: Square tiles (3×3 grid), L-tiles (3×2 grid with unusable spaces)
- Data attributes for conditional styling (shape, side, exit-position)

### Implementation Needs

**Core Data Models:**

- ✅ Board structure (tiles, spaces, coordinates)
- ✅ Mountain placement on square tiles (random patterns)
- ✅ Piece positions (mother, babies, scientists)
- ✅ Game state type with phase - implemented in gameState.ts
- 📐 Card state (decks, hands, played cards) - designed in ARCHITECTURE.md
- ⬜ Win condition tracking

**Key Systems to Build:**

- ✅ Tile/space coordinate system
- ✅ Global coordinate system (converting tile-local to board-global)
- ✅ Setup validation (piece placement rules) - via gameReducer
- ✅ GameState and gameReducer - implemented
- ✅ GameContext for state/dispatch access - implemented
- 📐 State machine phases - designed in ARCHITECTURE.md
- ⬜ Card selection UI (sequential: scientist then raptor)
- ⬜ Action point system and action validation
- ⬜ Line of sight calculations (for shooting mother)
- ⬜ Movement validation (orthogonal, obstacles)
- ⬜ Win condition checking
- ⬜ Turn/round management via reducer

**UI Components Needed:**

- ✅ Board grid rendering
- ✅ Tile rendering with spaces
- ✅ Piece rendering (mother, babies, scientists)
- ✅ HoldingPen for setup piece placement
- ⬜ Card hand display (hidden from opponent)
- ⬜ Player aids (tracking captured babies, sleep tokens, reserves)
- ⬜ Action point counter
- ⬜ Turn indicator

## Current Progress

### Completed

- ✅ Board type system with Coordinate, Space, SquareTile, LTile (Board interface removed)
- ✅ Board generation with asymmetric L-tile exit configuration
- ✅ Visual board rendering with 10 tiles in correct positions
- ✅ L-tile CSS for all 4 orientations (left/right × top/bottom)
- ✅ Global coordinate system (localToGlobal, globalToLocal, adjacency)
- ✅ Piece classes (MotherRaptor, BabyRaptor, Scientist) with movement rules
- ✅ HoldingPen component for setup piece placement
- ✅ Setup validation with placement rules (scientists on L-tiles, raptors on squares, etc.)
- ✅ Mountain patterns randomly assigned to square tiles
- ✅ GameState type with PieceState (plain objects for state)
- ✅ gameReducer with PLACE_SCIENTIST, PLACE_MOTHER, PLACE_BABY, MOVE_PIECE actions
- ✅ GameContext and useGame() hook for state/dispatch access
- ✅ App.tsx holds state via useReducer, provides context
- ✅ Board.tsx uses context, dispatches actions
- ✅ Comprehensive test suite (74 tests, all passing)

### Next Steps

1. **Card selection UI** - Sequential picking (scientist first, then raptor)
2. **Action point system** - Track and spend action points
3. **Line of sight** - Calculate shooting paths for scientists

### Technical Notes

- Tiles use local coordinates (0-2 for squares, 0-1 x-axis for L-tiles)
- Global coordinates span entire board for cross-tile movement
- L-tiles have "unusable" spaces (empty grid cells for layout)
- Exit spaces are only for baby raptor escapes
- Setup rules: Scientists on L-tiles (1 per tile), Mother on central tiles (2 or 7), Babies on remaining squares
- State lives in single GameState object at App level via useReducer
- Pieces in state are plain objects; piece classes (MotherRaptor, BabyRaptor, Scientist) encapsulate all piece logic (movement, actions, validation)
- Phase-based state machine controls valid actions at each point in the game
