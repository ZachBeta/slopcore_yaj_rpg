# Changelog

All notable changes to the Neon Dominance project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced gameplay loop with more strategic decisions
- Rebalanced economy for better early-game progression
- Improved run mechanics with jack out functionality
- Enhanced visual feedback during different game phases

## [0.2.1] - 2025-03-21

### Added
- Minimalist card game UI implementation with fully functional gameplay loop
- Complete game phase system (setup, start turn, action, discard, end turn, game over)
- Resource management system (credits and memory units)
- Action point management using click system
- Win conditions implementation:
  - Agenda points accumulation
  - Deck depletion mechanics
- Hand limit enforcement with discard phase
- Phase-based button state management
- Visual phase indication with colored labels

### Changed
- Updated UI elements to show click costs for actions
- Improved game state display with comprehensive information
- Enhanced card details display with type-specific attributes
- Restructured scene file to accommodate new gameplay elements

## [0.2.0] - 2025-03-21

### Added
- Complete turn-based gameplay loop with Runner and Corporation turns
- Card stacking system with proper visual organization
- Interactive card display with type-based coloring
- Game win conditions:
  - Runner: Install 5 or more programs (liberate citizen groups)
  - Corporation: Inflict 5 neural damage or maintain high compliance for 5 days
- Card installation and action point system
- Basic server structure for Corporation
- Automated Corporation AI actions
- Game state tracking and console log
- Main menu integration with game scene

### Changed
- Improved UI layout with proper card stacking to prevent screen overflow
- Enhanced visual feedback for different card types
- Reorganized game scene for better visibility of game elements

## [0.1.0] - 2025-03-21

### Added
- Initial project setup with Godot 4.4
- Main menu scene with start, options, and quit functionality
- Basic project structure and configuration
- Application icon
- Comprehensive testing framework with:
  - Unit tests for card system
  - Integration tests for Runner/Corporation interactions
  - System tests for game flow and win conditions
  - Performance tests for card operations
- Development roadmap and next steps documentation
- Project README with setup instructions

### Changed
- Optimized project configuration for web and mobile targets
- Simplified autoload dependencies

### Fixed
- Resolved initial errors due to missing files and dependencies
