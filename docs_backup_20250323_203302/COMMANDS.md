# Neon Dominance Command Reference

## Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Display all available commands | `help` |
| `draw` | Draw a card from your deck (costs 1 click) | `draw` |
| `hand` | Display all cards in your hand | `hand` |
| `install <N>` | Install card number N from hand (costs 1 click) | `install 2` |
| `run <server>` | Run on a server (costs 1 click) | `run R&D` |
| `jack_out` | Abort the current run | `jack_out` |
| `end` | End your turn | `end` |
| `discard <N>` | Discard card number N from hand | `discard 3` |

## Run Approaches

| Command | Description |
|---------|-------------|
| `run <server> --stealth` | Spend 1 credit, 50% chance to bypass first ICE |
| `run <server> --aggressive` | Deal with ICE more forcefully, can reduce damage |
| `run <server> --careful` | Makes jacking out easier, may reduce success |

## Status Commands

| Command | Description |
|---------|-------------|
| `status` | Show current game status |
| `credits` | Display credit account information |
| `memory` | Display memory allocation information |
| `installed` | List all installed cards |
| `system` | Display system status |
| `info` | Display game state information |

## Server Names

- **Core Servers**: `R&D`, `HQ`, `ARCHIVES`
- **Remote Servers**: `Remote1`, `Remote2`, `Remote3`

## Command Help

For detailed help on any command:

```
man <command>    # Detailed help for a specific command
help <command>   # Brief help for a specific command
```

## Script Options

### Game Launch

```bash
./run_game.sh [OPTIONS]
  --help        # Show help
  --seed NUM    # Set random seed
  --test        # Run in test mode
  --scenario S  # Run scenario (quick/full)
  --delay NUM   # Set delay in seconds
```

### Demo Mode

```bash
./demo.sh [OPTIONS]
  --ascii, -a   # Use ASCII game board
  --fast, -f    # No delay between actions
  --help, -h    # Show help
```

### Tests

```bash
./run_tests.sh [OPTIONS]
  --help        # Show help
  --verbose     # Detailed output
  <file.py>     # Run specific test file
``` 