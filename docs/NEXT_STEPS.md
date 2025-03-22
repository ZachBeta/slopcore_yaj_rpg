# Neon Dominance: Immediate Next Steps

## Current Status
- Basic project structure set up with Godot 4.4
- Main menu scene created
- Project configuration optimized for web and mobile

## Next Development Tasks

### 1. Card System Implementation (Priority: High)
- [ ] Create `Card` resource class
  - [ ] Define card properties (name, cost, type, effects)
  - [ ] Implement card serialization/deserialization
  - [ ] Add card artwork placeholder system
- [ ] Build card database system
  - [ ] JSON-based card definitions
  - [ ] Card loading and caching
  - [ ] Card filtering and search
- [ ] Develop card UI components
  - [ ] Card display template
  - [ ] Card interaction handlers
  - [ ] Card animation system

### 2. Game Board Implementation (Priority: High)
- [ ] Design game board layout
  - [ ] Runner side layout
  - [ ] Corporation side layout
  - [ ] Central play area
- [ ] Create board scene
  - [ ] Card placement zones
  - [ ] Resource trackers
  - [ ] Action buttons
- [ ] Implement drag-and-drop system
  - [ ] Card movement between zones
  - [ ] Target selection
  - [ ] Validation rules

### 3. Core Game Logic (Priority: High)
- [ ] Turn system
  - [ ] Phase management
  - [ ] Action tracking
  - [ ] Timer implementation
- [ ] Resource management
  - [ ] Credit system
  - [ ] Click tracking
  - [ ] Special resources
- [ ] Action resolution
  - [ ] Action queue
  - [ ] Effect resolution
  - [ ] State updates

### 4. Deck Building System (Priority: Medium)
- [ ] Deck editor UI
  - [ ] Card browser
  - [ ] Deck composition view
  - [ ] Filtering and sorting
- [ ] Deck validation
  - [ ] Faction rules
  - [ ] Card limits
  - [ ] Influence checks
- [ ] Deck storage
  - [ ] Local saving
  - [ ] Deck importing/exporting
  - [ ] Preset decks

### 5. Single Player AI (Priority: Medium)
- [ ] Basic AI framework
  - [ ] Decision tree system
  - [ ] Action evaluation
  - [ ] Threat assessment
- [ ] Corporation AI
  - [ ] ICE placement strategy
  - [ ] Agenda advancement logic
  - [ ] Economic management
- [ ] Runner AI
  - [ ] Run timing decisions
  - [ ] Icebreaker installation priority
  - [ ] Resource management

### 6. Game State Management (Priority: Medium)
- [ ] Save/load system
  - [ ] Game state serialization
  - [ ] Checkpoint system
  - [ ] Auto-save functionality
- [ ] Game history
  - [ ] Action log
  - [ ] Replay system
  - [ ] Analytics tracking
- [ ] Settings persistence
  - [ ] User preferences
  - [ ] Control configurations
  - [ ] Audio settings

### 7. UI/UX Improvements (Priority: Medium)
- [ ] Theme system
  - [ ] Color schemes
  - [ ] Font selection
  - [ ] UI element styling
- [ ] Responsive design
  - [ ] Layout adjustments for different screens
  - [ ] Touch vs. mouse controls
  - [ ] Accessibility options
- [ ] Feedback systems
  - [ ] Visual effects
  - [ ] Sound effects
  - [ ] Haptic feedback

### 8. Asset Creation (Priority: Low initially)
- [ ] Placeholder graphics
  - [ ] Card templates
  - [ ] UI elements
  - [ ] Game board
- [ ] Sound design
  - [ ] UI sounds
  - [ ] Ambient music
  - [ ] Effect sounds
- [ ] Animation system
  - [ ] Card movements
  - [ ] Effect visualizations
  - [ ] Transitions

## Technical Tasks

### 1. Project Structure Refinement
- [ ] Organize project folders
  - [ ] Separate UI, logic, and data
  - [ ] Create resource directories
  - [ ] Set up asset pipelines
- [ ] Implement autoloads
  - [ ] GameState singleton
  - [ ] EventBus for communication
  - [ ] Settings manager
- [ ] Create build configurations
  - [ ] Development build
  - [ ] Testing build
  - [ ] Release build

### 2. Testing Framework
- [ ] Unit testing setup
  - [ ] Test card interactions
  - [ ] Test game rules
  - [ ] Test AI decisions
- [ ] Integration testing
  - [ ] Full game flow tests
  - [ ] UI interaction tests
  - [ ] Performance benchmarks
- [ ] Automated testing
  - [ ] CI/CD pipeline
  - [ ] Regression tests
  - [ ] Coverage reporting

### 3. Documentation
- [ ] Code documentation
  - [ ] Function and class comments
  - [ ] Architecture diagrams
  - [ ] API documentation
- [ ] Game rules documentation
  - [ ] Card interaction rules
  - [ ] Turn sequence
  - [ ] Special cases
- [ ] Development guides
  - [ ] Contribution guidelines
  - [ ] Style guide
  - [ ] Best practices
