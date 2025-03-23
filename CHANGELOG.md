# Changelog

All notable changes to the Neon Dominance project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Economic Rebalancing
  - Increased starting credits from 5 to 8
  - Automatic +1 credit per turn
  - Additional memory unit (5 MU total)

- Enhanced Run Mechanics
  - Run approach options (stealth, aggressive, careful)
  - ICE-specific interactions with different approaches

- Visual Improvements
  - Server structure visualization
  - Enhanced ICE representations
  - Run progress visualization

## [0.7.1] - 2025-03-23

### Added
- Improved drone control system that respects orientation
  - W/S keys now move along the drone's local Y axis instead of global Y
  - Enhanced movement with comprehensive tests for various orientations
  - Fixed test suite for player movement with proper expectations

## [0.7.0] - 2025-03-23

### Added
- Open World prototype with Three.js implementation
- 3D environment with player movement and physics
- Multiplayer functionality with Socket.io integration
- Advanced movement controls with 6 degrees of freedom
- Player collision detection and interaction
- Integrated with existing game UI

### Changed
- Updated input system to support more complex movement
- Enhanced 3D rendering with improved performance
- Expanded networking capabilities for multiplayer support

## [0.6.1] - 2025-03-22

### Added
- Reintroduced Three.js spinning cube on the main page
- Added hidden teapot easter egg (can you find it?)
- Inline ASCII art directly into card data for better rendering
- Enhanced card display in console with visual art

### Changed
- Improved console renderer to display card ASCII art
- Updated cyberpunk styling with neon effects

## [0.6.0] - Current Version

### Added
- More flavor text on cards
- Jack out command to abort runs
- Improved card ability system

## [0.5.1] - Previous Version

### Added
- Card ability system with triggers and effects
- Resource management (credits and memory units)
- Run and ICE encounter system
- Corporation AI turn with visual distinction
- Turn start triggered abilities

## [0.5.0] - Previous Major Release

### Added
- Complete turn-based gameplay loop
- Server structure implementation
- Core card mechanics

## [0.3.0] - Earlier Release

### Added
- Enhanced user interface
- Additional card types
- Basic AI behavior
