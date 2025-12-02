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
- Simultaneously reveal one card per round
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

### Components

- **App.tsx**: Root component
- **Board.tsx**: Game board container, renders all 10 tiles in visual order
- **Tile.tsx**: Individual tile component with data attributes for styling

### Types (`src/types/board.ts`)

- **Coordinate**: x, y position
- **Space**: Board space with coordinate, hasRock, isExit, isUnusable flags
- **SquareTile**: 3×3 grid (9 spaces)
- **LTile**: 3×2 grid with side (left/right) and exitPosition (top/bottom)
- **Board**: Container for all 10 tiles

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
- ⬜ Rock placement on square tiles
- ⬜ Game state (current round, active player, phase)
- ⬜ Piece positions (mother, babies, scientists)
- ⬜ Card state (decks, hands, played cards)
- ⬜ Win condition tracking

**Key Systems to Build:**

- ✅ Tile/space coordinate system
- ⬜ Global coordinate system (converting tile-local to board-global)
- ⬜ Card selection and simultaneous reveal UI
- ⬜ Action point system and action validation
- ⬜ Line of sight calculations (for shooting mother)
- ⬜ Movement validation (orthogonal, obstacles)
- ⬜ Win condition checking
- ⬜ Turn/round management

**UI Components Needed:**

- ✅ Board grid rendering
- ✅ Tile rendering with spaces
- ⬜ Piece rendering (mother, babies, scientists, rocks, fire)
- ⬜ Card hand display (hidden from opponent)
- ⬜ Player aids (tracking captured babies, sleep tokens, reserves)
- ⬜ Action point counter
- ⬜ Turn indicator

## Current Progress

### Completed

- ✅ Board type system with Coordinate, Space, SquareTile, LTile, Board
- ✅ Board generation with asymmetric L-tile exit configuration
- ✅ Visual board rendering with 10 tiles in correct positions
- ✅ L-tile CSS for all 4 orientations (left/right × top/bottom)
- ✅ Comprehensive test suite (21 tests, all passing)
- ✅ Aggressive refactor reducing code by 63%

### Next Steps

1. **Add rock placement** - Implement rock positions on square tiles (rules specify certain spaces)
2. **Global coordinates** - Convert tile-local (x,y) to board-global coordinates
3. **Piece rendering** - Add game pieces (mother, babies, scientists) to board
4. **Initial setup** - Place pieces in starting positions per game rules

### Technical Notes

- Tiles use local coordinates (0-2 for squares, 0-1 x-axis for L-tiles)
- Board needs global coordinate system for piece movement
- L-tiles have "unusable" spaces (empty grid cells for layout)
- Exit spaces are only for baby raptor escapes
- Game rules: rocks placed on spaces without circles (need to determine pattern)
