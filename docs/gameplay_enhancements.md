# Neon Dominance: Gameplay Loop Enhancements

This document outlines proposed improvements to make the Neon Dominance gameplay loop more engaging, strategic, and immersive.

## Current Analysis

### What's Working Well
1. **Visual Presentation**: ASCII art and colored text add personality to the game
2. **Card Ability System**: Structured ability format with triggers and effects
3. **ICE Encounters**: Provide tension during runs
4. **Corporation Phase**: Visually distinct AI turn
5. **Turn Start Effects**: Card abilities that trigger at the start of turns

### Areas to Improve

## 1. ICE Breaking Mechanics

Currently, players struggle to break ICE due to resource constraints and limited breaker options.

**Proposed Improvements:**

- **Economic Balance**
  - Start with 8 credits instead of 5
  - Provide at least one affordable breaker in starting hand
  - Add cheaper "basic breaker" options (1-2 credit cost)

- **ICE Complexity Tiers**
  - **Weak ICE**: Can be broken without specialized breakers (skill check)
  - **Standard ICE**: Requires basic breakers
  - **Advanced ICE**: Requires specialized breakers and higher strength

- **Alternative Breaking Methods**
  - Temporary "force break" option (spend extra credits instead of having proper breaker)
  - "Hardware bypass" options (single-use items that can break specific ICE types)

## 2. More Interactive Runs

Runs should offer more strategic choices beyond success/failure.

**Proposed Improvements:**

- **Run Approaches**
  - `run <server> --stealth`: Lower success chance but fewer ICE encounters
  - `run <server> --aggressive`: Higher chance of damage but better rewards
  - `run <server> --careful`: Lower reward but ability to jack out without consequences

- **Jack Out Mechanics**
  - `jack_out` command to abort run after encountering ICE
  - Different ICE types have different jack out consequences
  - Jack out success chance based on runner stats/cards

## 3. Economy & Resource Development

Economic growth feels too slow, limiting strategic options.

**Proposed Improvements:**

- **Enhanced Income Streams**
  - Base income: +2 credits per turn
  - Daily operations: Optional click for +1 credit

- **Resource Management**
  - Memory management becomes more strategic
  - Hardware upgrades that provide persistent benefits

## 4. Visual Improvements

Enhance the visual presentation for better immersion.

**Proposed Improvements:**

- **Enhanced ASCII Art**
  - Specific art for different ICE types
  - Server visualization showing ICE protection

- **Board State Visualization**
  - ASCII representation of the game board
  - Color coding for different card types and states

## Implementation Priority

1. **High Priority** (Immediate gameplay impact)
   - Rebalance starting credits and card costs
   - Implement jack out command and run choices
   - Add ICE complexity tiers with varied breaking requirements

2. **Medium Priority** (Enhanced experience)
   - Add server visualization
   - Improve visual feedback during runs
   - Create more distinct ICE representations

## Technical Implementation Notes

- Keep core game logic separate from visual enhancements
- Implement ability system as a flexible event-trigger framework
- Create modular command extensions for new run options
- Design narrative content in external data files for easy expansion 