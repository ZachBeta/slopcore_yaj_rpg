# Input System Refactoring

## Completed Work
1. Created centralized input system in `web/src/constants/input.ts`:
   - Defined `InputAction` enum for all possible actions
   - Created `InputMapping` interface for key-to-action mapping
   - Implemented `INPUT_MAPPINGS` array for key bindings
   - Added utility functions for key/action conversion

2. Updated `Player` class:
   - Replaced direct key handling with action-based system
   - Added `activeActions` Set to track current input state
   - Implemented `handleActionDown` and `handleActionUp` methods
   - Added debug logging for movement and actions
   - Adjusted initial player rotation to face camera

3. Updated `OpenWorldGame` class:
   - Modified key event handlers to use new input system
   - Added debug logging for key events
   - Improved event listener setup

## Current Status
- ✅ IJKL (look controls) working
- ✅ SPACE (jump) working
- ✅ Key detection working (confirmed via console logs)
- ❌ WASD movement not working despite key detection

## Known Issues
1. WASD Movement:
   - Keys are being detected (showing in console logs)
   - Movement calculations appear correct
   - Possible issues:
     - Movement direction calculation in `handleMovement`
     - Camera-player relationship
     - Coordinate system alignment

## Next Steps
1. Debug WASD Movement:
   - Add more detailed logging in movement calculations
   - Verify camera-player coordinate systems
   - Check movement direction vector calculations
   - Consider adding visual debugging helpers

2. Potential Improvements:
   - Add input configuration system
   - Implement key rebinding
   - Add input state persistence
   - Consider adding input buffering for smoother controls

## Technical Notes
- Player rotation is initialized to face camera (Math.PI)
- Movement is relative to player rotation
- Camera is positioned at (0, 5, 10) looking at (0, 0, 0)
- Movement speed is set to 5 units per second 