# Inbox

Items from this file have been consolidated into [ROADMAP.md](ROADMAP.md), which now serves as the primary location for tracking features and development priorities.

Please add any new feature ideas or tasks to the appropriate section in ROADMAP.md instead of this file.

## Quick References

- Current sprint tasks: See "High Priority" in ROADMAP.md
- Documentation index: See docs/README.md
- Command reference: See COMMANDS.md

# top
* scrollback keeps failing

# unsorted
* render ascii versions of the game board and the cards, I should see my entire hand as a series of ascii cards
* write game state to a sqlite database, and have run_game and game_board_render both refer to the same game, so we can open a terminal to watch the game board, and a terminal to play the game
* containerize all python so it's easier to run on other userspace environments
* open tmux to make the game look like cursor, left rail is the state of the player's hand in a tree, mid top is a space for detailed inspection of things, mid bottom is the action area, right side is "crash_and_burn.sh" which is a minimalist "agent" that can help the player make game decisions
* containerize all python so it's easier to run on other userspace environments