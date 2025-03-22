# Neon Dominance: Implementation Plan

This document outlines the specific implementation steps for improving the gameplay loop in the terminal-based version of Neon Dominance, focusing on the highest priority enhancements.

## Phase 1: Economic Rebalancing

### Tasks

1. **Adjust Starting Resources**
   - Increase starting credits from 5 to 8
   - Add an additional memory unit (5 MU total)
   - Start with 6 cards instead of 5

2. **Economic Flow Improvements**
   - Modify turn start to grant +1 credit automatically
   - Add "daily operations" option: spend 1 click for +2 credits
   - Create more affordable basic cards for early game

3. **Card Cost Adjustments**
   - Reduce costs of basic breakers by 1 credit
   - Create tiered pricing: basic cards (1-2c), intermediate (2-3c), advanced (3-5c)

### Files to Modify

- `cmd/terminal_game/terminal_game.py`: Adjust starting values
- `cmd/terminal_game/card_data.py`: Modify card costs
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

3. **ICE Complexity Tiers**
   - Tag existing ICE with complexity tier (weak, standard, advanced)
   - Implement "force break" mechanic (spend 2 extra credits to break weak ICE without breaker)
   - Add partial success outcomes for certain ICE types

### Files to Modify

- `cmd/terminal_game/terminal_game.py`: Add new commands and run logic
- `cmd/terminal_game/_cmd_run` method: Enhance with new options
- Add new command: `jack_out` for run abort functionality

## Phase 3: Visual and Feedback Enhancements

### Tasks

1. **Server Visualization**
   - Create ASCII representation of server structure
   - Show installed ICE on the approach path
   - Visually indicate server contents when known

2. **Run Progress Visualization**
   - Create step-by-step visual representation of run progress
   - Add animation frames for different run phases
   - Implement visual credit counter changes

3. **Enhanced ICE Representation**
   - Create specific ASCII art for each ICE type
   - Add color coding based on ICE strength and type
   - Implement dynamic visual effects for ICE encounters

### Files to Modify

- `cmd/terminal_game/game_renderer.py`: Add new visualization methods
- Create new ASCII art assets for different ICE types
- Enhance feedback during run command execution

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

3. **User Experience Testing**
   - Recruit 3-5 test players to evaluate gameplay flow
   - Collect feedback on command intuitiveness and game pacing

## Metrics for Success

1. **Player Engagement**
   - Average number of turns per game increases to 10+ (indicating deeper strategy)
   - Players attempt runs on multiple different servers in a typical game

2. **Strategic Depth**
   - Players utilize at least 3 different breaker programs in a typical game
   - Economy supports multiple viable strategies (aggressive running vs. setup)

3. **Game Balance**
   - Win rates between Runner and Corporation remain between 40-60%
   - No single card or strategy dominates gameplay 