# todo
* ✅ can we go so minimalist as to create a new mode CLI mode? or command line mode, or something else?
* ✅ tab completion (implemented in CLI mode)
* ✅ maybe treat "cards" as files on a file system (implemented in CLI mode)
* ✅ instead of drawing a card, we curl a script (conceptually implemented in CLI mode)
* let's add back in the ascii art


* ✅ Create minimalist card game UI (Version 1) for basic gameplay
* ✅ Implement full game loop with win/lose conditions in the minimalist UI
* ✅ Create terminal-based game mode for testing without Godot rendering
* Add more card interactions and special abilities support
* Improve card display with basic visual enhancements (Version 2)
* Implement Corporation side gameplay
* Consider adding simple animations for card actions (Version 3)

## Current Progress

* Terminal-based implementation completed with:
  * Real terminal interface independent of Godot
  * Command-line gameplay with same mechanics as Godot version
  * Support for automated testing
  * Reproducible gameplay with random seed control

* Version 1 minimalist UI implemented with:
  * Text-based card representation
  * Simple button-based gameplay (draw, play, discard)
  * Card details display
  * Basic game state tracking

* Version 0.2.x+1 completed with:
  * Full gameplay loop with game phases (setup, start turn, action, discard, end turn)
  * Win conditions through agenda points and deck depletion
  * Action point management with click system
  * Resource management (credits and memory units)
  * Hand limit enforcement

* Things to improve:
  * Add Corporation gameplay
  * Connect game logic to the UI for special card abilities
  * Add visual feedback for actions
  * Enhance terminal mode with more detailed gameplay elements

## Future Versions

See the detailed UI development roadmap in `/docs/ui_roadmap.md`

## reference/notes

* Card visualization is now handled through both terminal-based and simplified text-based approaches
* Terminal mode allows for testing gameplay mechanics without Godot rendering
* The minimalist UI focuses on core gameplay functionality and readability
* UI development will follow an incremental approach from minimal to full-featured
* Current functionality includes a complete game loop with resource management, win conditions, and structured gameplay phases

## previous notes

* actually read the requirements xd
    * I think it's a deck building game like Dominion? I've never played netrunner, but I know it's a big deal