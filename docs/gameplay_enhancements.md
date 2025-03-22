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
  - "Brute force" option (take net damage to bypass weaker ICE)

## 2. More Interactive Runs

Runs should offer more strategic choices beyond success/failure.

**Proposed Improvements:**

- **Run Phases with Decision Points**
  - **Approach**: Choose run path (direct, stealth, etc.) affecting ICE encountered
  - **Encounter**: Options to jack out, continue, or use special abilities
  - **Access**: Choices on how to interact with accessed cards

- **New Run Commands**
  - `run <server> --stealth`: Lower success chance but fewer ICE encounters
  - `run <server> --aggressive`: Higher chance of damage but better rewards
  - `run <server> --careful`: Lower reward but ability to jack out without consequences

- **Jack Out Mechanics**
  - Add `jack_out` command to abort run after encountering ICE
  - Different ICE types have different jack out consequences
  - Jack out success chance based on runner stats/cards

- **Partial Successes**
  - "You couldn't fully break the ICE but managed to slip past with 1 damage"
  - Gain partial information from unsuccessful runs
  - "ICE weakness revealed" for future run attempts

## 3. Economy & Resource Development

Economic growth feels too slow, limiting strategic options.

**Proposed Improvements:**

- **Enhanced Income Streams**
  - Base income: +2 credits per turn
  - Daily operations: Optional click for +1 credit
  - Resource cards provide better passive income
  - Mining operations that accumulate credits over turns

- **Credit Storage Options**
  - Banking cards to store excess credits safely
  - Credit caches with different access restrictions
  - Investment options with delayed but higher returns

- **Resource Management**
  - Memory management becomes more strategic
  - Hardware upgrades that provide persistent benefits
  - Resource converting cards (trade credits for cards, etc.)

## 4. Strategic Progression

Create a clearer sense of progression through the game.

**Proposed Improvements:**

- **Game Phase Distinction**
  - **Early Game** (turns 1-3): Setup and economy building
  - **Mid Game** (turns 4-6): Server infiltration and agenda gathering
  - **Late Game** (turns 7+): High-risk, high-reward runs

- **Card Tiers**
  - Tier 1: Affordable starter cards with basic effects
  - Tier 2: Mid-game cards with stronger abilities
  - Tier 3: Expensive but powerful late-game options

- **Upgrade Paths**
  - Ability to improve existing installed cards
  - Specialization options for core components
  - Synergy bonuses for complementary card sets

## 5. Narrative Elements

Add storytelling elements to increase immersion.

**Proposed Improvements:**

- **Server Flavor Text**
  - Unique descriptions for each server when accessed
  - Thematic messages based on corporation type
  - Story snippets revealed through successful runs

- **Corporate Events**
  - Random events affecting gameplay each turn
  - Security alerts after multiple successful runs
  - Corporate reactions to runner actions

- **Mission Structure**
  - Mini-objectives beyond agenda collection
  - Special contract runs with unique rewards
  - Escalating narrative challenges

## 6. Visual Improvements

Enhance the visual presentation for better immersion.

**Proposed Improvements:**

- **Enhanced ASCII Art**
  - Specific art for different ICE types
  - Dynamic art that changes with game state
  - Server visualization showing ICE protection

- **Board State Visualization**
  - ASCII representation of the game board
  - Icons showing installed cards and their states
  - Color coding for different card types and states

- **Dynamic UI Elements**
  - Progress bars for ongoing operations
  - Visual alerts for important events
  - Timeline visualization for turn history

## Implementation Priority

1. **High Priority** (Immediate gameplay impact)
   - Rebalance starting credits and card costs
   - Implement jack out command and run choices
   - Add ICE complexity tiers with varied breaking requirements

2. **Medium Priority** (Enhanced experience)
   - Add narrative elements and server flavor text
   - Create card upgrade paths
   - Implement more visual improvements

3. **Long Term** (Depth and replayability)
   - Develop full progression system
   - Create corporate events system
   - Implement specialized game modes

## Technical Implementation Notes

- Keep core game logic separate from visual enhancements
- Implement ability system as a flexible event-trigger framework
- Create modular command extensions for new run options
- Design narrative content in external data files for easy expansion 