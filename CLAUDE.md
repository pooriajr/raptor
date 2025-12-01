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

# Preview production build
npm run preview
```

## Technical Stack

- **React 19** with TypeScript (strict mode)
- **Vite 7** for build tooling with Fast Refresh
- **Module Resolution**: ESNext with bundler mode
- **Styling**: Component-scoped CSS files

## Current Architecture

### Components (Basic Structure)
- **App.tsx**: Root component
- **Board.tsx**: Game board container (currently renders 6 tiles)
- **Tile.tsx**: Individual tile component

### Implementation Needs

**Core Data Models:**
- Game state (current round, active player, phase)
- Board state (tile layout, rock positions, fire tokens)
- Piece positions (mother, babies, scientists)
- Card state (decks, hands, played cards)
- Win condition tracking

**Key Systems to Build:**
- Tile/space coordinate system (board is made of tiles, tiles contain spaces)
- Card selection and simultaneous reveal UI
- Action point system and action validation
- Line of sight calculations (for shooting mother)
- Movement validation (orthogonal, obstacles)
- Win condition checking
- Turn/round management

**UI Components Needed:**
- Board grid rendering (tiles with spaces)
- Piece rendering (mother, babies, scientists, rocks, fire)
- Card hand display (hidden from opponent)
- Player aids (tracking captured babies, sleep tokens, reserves)
- Action point counter
- Turn indicator

## Current Progress

### Completed
- ✅ Created `src/types/board.ts` with basic type definitions:
  - `Coordinate` interface (x, y positions)
  - `Space` interface (coordinate, hasRock, isExit flags)
  - `createSpace()` helper function
- ✅ Created test in `src/App.tsx` demonstrating type usage
- ✅ Learned TypeScript basics: interfaces, type annotations, `import type`

### In Progress
- 🔄 Board data structure (need to add: Tile type, Board type, and board generation logic)

### Next Steps
1. Add Tile type and board generation to `src/types/board.ts`
2. Create visual board rendering component
3. Implement piece rendering (game figurines)
4. Build complete game state management

### Important Notes for Future Sessions
- **Developer Background**: Rails developer, new to TypeScript - explain concepts slowly
- **TypeScript Import Pattern**: Use `import type { }` for interfaces, regular `import { }` for functions
- **Game Design Decisions**:
  - Single screen multiplayer for now (online play in future iteration)
  - Using random tile placement from game rules
  - Representing actual tiles (not just grid) because some abilities care about tile boundaries
  - Using (x, y) coordinate system for orthogonal movement