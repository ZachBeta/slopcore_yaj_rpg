# Neon Dominance: Implementation Plan

This document outlines the specific implementation steps for improving the gameplay loop in the terminal-based version of Neon Dominance, focusing on the highest priority enhancements.

## Phase 1: Economic Rebalancing

### Tasks

1. **Adjust Starting Resources**
   - Increase starting credits from 5 to 8
   - Add an additional memory unit (5 MU total)

2. **Economic Flow Improvements**
   - Modify turn start to grant +1 credit automatically
   - Add "daily operations" option: spend 1 click for +2 credits

### Files to Modify

- `cmd/terminal_game/terminal_game.py`: Adjust starting values
- Add new command: `work` or `mine` for credit generation

## Phase 2: Enhanced Run Mechanics

### Tasks

1. **Jack Out Implementation**
   - Add `jack_out` command to abort run after encountering ICE
   - Implement success chance calculation based on ICE type
   - Define consequences for failed jack out attempts

2. **Run Approach Options**
   - Extend run command with `--stealth`, `--aggressive`, and `--careful` flags
   - Implement effects for each approach:
     - `--stealth`: 50% chance to bypass first ICE, but -1 credit cost
     - `--aggressive`: +1 strength against ICE, but take 1 damage if unsuccessful
     - `--careful`: Guaranteed safe jack out, but -1 card access

### Files to Modify

- `cmd/terminal_game/terminal_game.py`: Add new commands and run logic
- `cmd/terminal_game/_cmd_run` method: Enhance with new options

## Phase 3: Visual Enhancements

### Tasks

1. **Server Visualization**
   - Create ASCII representation of server structure
   - Show installed ICE on the approach path

2. **Run Progress Visualization**
   - Create step-by-step visual representation of run progress
   - Implement visual credit counter changes

3. **Enhanced ICE Representation**
   - Create specific ASCII art for each ICE type
   - Add color coding based on ICE strength and type

### Files to Modify

- `cmd/terminal_game/game_renderer.py`: Add new visualization methods
- Create new ASCII art assets for different ICE types

## Implementation Timeline

### Week 1: Economic Rebalancing
- Day 1-2: Adjust starting values and implement automatic credit gain
- Day 3-4: Add "work" command and enhance credit generation
- Day 5: Test and balance the economy

### Week 2: Run Mechanics
- Day 1-2: Implement jack_out command and logic
- Day 3-4: Add run approach options
- Day 5-7: Create ICE tiers and breaking mechanics

### Week 3: Visual Enhancements
- Day 1-3: Create server visualization
- Day 4-5: Enhance run progress display
- Day 6-7: Implement ICE-specific ASCII art

## Testing Strategy

1. **Economic Balance Testing**
   - Run 10 sample games to ensure player can afford basic breakers by turn 3
   - Verify credit flow remains balanced and doesn't trivialize late game

2. **Run Mechanics Testing**
   - Test each approach option against different ICE configurations
   - Ensure jack out mechanic provides meaningful choice without being overpowered 