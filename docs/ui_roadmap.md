# Card Game UI Development Roadmap

This document outlines the progressive development of our card game UI, focusing on incremental improvements while ensuring the game is playable at each stage.

## Version 1: Text-Based Command Interface

**Goal:** Create a playable version with minimal UI complexity, focusing on core gameplay.

- [ ] Replace graphical cards with text-based lists
- [ ] Implement gameplay through numbered options and buttons
- [ ] Show hand as numbered list of cards
- [ ] Simple button-based interactions (Draw, Play Selected, Discard)
- [ ] Text description area for card details
- [ ] Basic game state display (credits, clicks remaining, etc.)

**Implementation Steps:**
- [ ] Replace card container with a ScrollContainer + VBoxContainer
- [ ] Each card represented as a simple button with name + cost
- [ ] Selection highlights the button
- [ ] Play area shows text representation of played cards
- [ ] Implement back-end card logic independent of UI

## Version 2: Basic Card Visuals with Fixed Positioning

**Goal:** Introduce simple card visuals without complex interactions.

- [ ] Basic card templates with minimal art (colored rectangles with text)
- [ ] Fixed grid layouts for hand and play areas
- [ ] Click-to-select instead of drag-and-drop
- [ ] Button-driven actions (no direct card dragging)
- [ ] Clear visual distinction between zones

**Implementation Steps:**
- [ ] Introduce basic card sprites/textures
- [ ] Maintain button-based selection and actions
- [ ] Add visual indicators for selection state
- [ ] Implement fixed grid layouts for card placement
- [ ] Create separate visual zones for different card areas (hand, play area, deck)

## Version 3: Enhanced Visuals with Basic Animation

**Goal:** Add visual polish while maintaining simplicity.

- [ ] Improved card templates with art placeholders
- [ ] Simple animations for card draw/play/discard
- [ ] Tabular view for detailed card information
- [ ] Hover states for additional information
- [ ] "Action confirmation" for card plays

**Implementation Steps:**
- [ ] Add tweens for card animations
- [ ] Implement hover states for cards
- [ ] Create better visual hierarchy between game zones
- [ ] Add feedback animations for actions
- [ ] Improve card detail visualization

## Version 4: Streamlined Drag & Drop

**Goal:** Introduce limited drag & drop in a controlled way.

- [ ] Implement drag and drop between predefined zones
- [ ] Clear drop targets with visual indicators
- [ ] "Snap-to" positioning in play areas
- [ ] Keep button-based alternatives for all actions
- [ ] Mobile-friendly touch controls

**Implementation Steps:**
- [ ] Add drag functionality to cards but with constrained destinations
- [ ] Implement drop zones with clear visual feedback
- [ ] Maintain button alternatives for accessibility
- [ ] Test and optimize touch interactions for mobile

## Version 5: Full Card Experience

**Goal:** Complete card visualization and interaction experience.

- [ ] Full card art and design
- [ ] Fluid animations for all card movements
- [ ] Advanced positioning options (stacking, fanning)
- [ ] Polished transitions between game phases
- [ ] Responsive layout for different screen sizes

**Implementation Steps:**
- [ ] Implement responsive card layouts
- [ ] Add polish to all animations and transitions
- [ ] Support multiple card viewing modes (compact/expanded)
- [ ] Optimize for both desktop and mobile experiences
- [ ] Final visual polish and performance optimization

## Technical Implementation Notes

1. **Card Logic Separation:**
   - [ ] Create a CardController class that handles the model of the card game
   - [ ] Build different views (V1-V5) that all use the same controller
   - [ ] This separation allows you to swap UI implementations while keeping game logic intact

2. **Testing Strategy:**
   - [ ] Create a simple test scene for each version that showcases basic actions
   - [ ] Write unit tests for core gameplay functionality
   - [ ] Implement automated testing for card interactions

3. **Cross-Platform Considerations:**
   - [ ] Ensure UI works well on WebGL/HTML5 export
   - [ ] Test mobile touch controls early in development
   - [ ] Optimize performance for lower-end devices
