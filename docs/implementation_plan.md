# Neon Dominance: Implementation Plan

Core implementation steps for gameplay improvements:

## Phase 1: Economic Rebalancing

**Tasks:**
- Increase starting credits from 5 to 8
- Add an additional memory unit (5 MU total)
- Modify turn start to grant +1 credit automatically
- Add "work" command for additional credits

**Files:**
- `web/src/terminal-game/terminal-game.ts`

## Phase 2: Enhanced Run Mechanics

**Tasks:**
- Add `jack_out` command with:
  - Success chance based on ICE type
  - Consequences for failed attempts
- Add run approach options:
  - `--stealth`: Fewer ICE encounters, costs more
  - `--aggressive`: Better rewards, higher damage risk
  - `--careful`: Safe jack out, fewer rewards

**Files:**
- `web/src/terminal-game/terminal-game.ts`
- `web/src/terminal-game/game-phases.ts`

## Phase 3: Visual Enhancements

**Tasks:**
- Create ASCII server structure visualization
- Implement run progress visualization
- Add distinct ICE type representations

**Files:**
- `web/src/terminal-game/console-renderer.ts`
- ASCII art assets

## Testing Strategy

1. **Economic Testing**
   - Ensure player can afford basic breakers by turn 3
   - Verify economy remains balanced in late game

2. **Run Mechanics Testing**
   - Test each approach against different ICE configurations
   - Ensure jack out provides meaningful choices 