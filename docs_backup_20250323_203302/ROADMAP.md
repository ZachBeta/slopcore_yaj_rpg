# Neon Dominance Roadmap

## Completed Features

- ✅ Terminal-based game implementation
- ✅ Asymmetric gameplay (Runner vs Corporation)
- ✅ Strategic AI opponent
- ✅ Resource management (credits, memory units)
- ✅ Run and ICE encounter system
- ✅ Jack out mechanics
- ✅ ASCII game board renderer
- ✅ Demo mode with fast iteration option

## High Priority (Next Sprint)

### Gameplay
- [ ] Economic rebalancing
  - [ ] Adjust starting credits (5 → 8)
  - [ ] Increase memory units (4 → 5)
  - [ ] Add auto-credit at turn start
  - [ ] Add "work" command
- [ ] Complete run approach options
  - [ ] Optimize stealth approach implementation
  - [ ] Enhance aggressive approach implementation
  - [ ] Refine careful approach implementation

### Visuals
- [ ] Enhance ASCII game board
  - [ ] Render complete hand as series of ASCII cards
  - [ ] Improve server visualizations
  - [ ] Update ICE visualization by type

## Medium Priority

### Data Storage
- [ ] Add SQLite database for game state
  - [ ] Write game state to database
  - [ ] Create interface for game_board_render to read from same database
  - [ ] Allow multiple terminals to connect to same game

### Developer Experience
- [ ] Containerize Python environment
  - [ ] Create Docker setup
  - [ ] Make running easier on other userspace environments

## Low Priority / Future Features

### User Experience
- [ ] Tmux-based UI layout
  - [ ] Left rail for player's hand
  - [ ] Mid top for detailed inspections
  - [ ] Mid bottom for action area
  - [ ] Right side for agent helper

### AI Features
- [ ] Create "crash_and_burn.sh" agent
  - [ ] Build minimalist agent to help player make decisions
  - [ ] Add strategy suggestions

## Notes

- Priority order may change based on development needs
- Features may be moved between priority levels
- Technical debt and bug fixes take precedence over new features 