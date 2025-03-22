/**
 * Command documentation for Neon Dominance Terminal Game
 */

export interface CommandDoc {
  NAME: string;
  SYNOPSIS: string;
  DESCRIPTION: string;
  EXAMPLES: string;
  SEE_ALSO: string;
}

export const validCommands: Record<string, string> = {
  help: "Display available commands and usage information",
  draw: "Draw a card from your deck",
  hand: "List all cards in your hand",
  install: "Install a program from your hand",
  run: "Initiate a run on a corporate server",
  jack_out: "Attempt to abort the current run",
  end: "End your current turn",
  info: "Display game state information",
  discard: "Discard a card from your hand",
  system: "Display system status",
  installed: "List all installed programs",
  credits: "Display credit account information",
  memory: "Display memory allocation information",
  man: "Display manual page for a command"
};

export const commandManPages: Record<string, CommandDoc> = {
  help: {
    NAME: "help - display help information about available commands",
    SYNOPSIS: "help [command]",
    DESCRIPTION: "Display a list of available commands or specific information about a command. " +
                "When invoked without arguments, help displays a list of all available commands. " +
                "When invoked with a command name as an argument, displays detailed help for that command.",
    EXAMPLES: "help\nhelp install\nhelp run",
    SEE_ALSO: "man"
  },
  man: {
    NAME: "man - display manual page for commands",
    SYNOPSIS: "man <command>",
    DESCRIPTION: "Display the manual page for the specified command. " +
                "Provides detailed information about command usage, options, and functionality.",
    EXAMPLES: "man draw\nman install\nman run",
    SEE_ALSO: "help"
  },
  draw: {
    NAME: "draw - draw a card from your deck",
    SYNOPSIS: "draw",
    DESCRIPTION: "Retrieves one file from your data stack and adds it to your hand. " +
                "This operation costs 1 click during the action phase.",
    EXAMPLES: "draw",
    SEE_ALSO: "hand, discard"
  },
  hand: {
    NAME: "hand - list all cards in your hand",
    SYNOPSIS: "hand",
    DESCRIPTION: "Displays a list of all files currently in your hand. " +
                "Each entry includes the card name, type, and relevant stats.",
    EXAMPLES: "hand",
    SEE_ALSO: "draw, install, discard"
  },
  install: {
    NAME: "install - install a program from your hand",
    SYNOPSIS: "install <card_number>",
    DESCRIPTION: "Installs a program from your hand onto your rig. " +
                "This operation costs 1 click plus the program's credit cost. " +
                "Programs also consume memory units which are limited by your available MU.",
    EXAMPLES: "install 2",
    SEE_ALSO: "hand, installed, memory"
  },
  run: {
    NAME: "run - initiate a run on a corporate server",
    SYNOPSIS: "run <server> [--stealth|--aggressive|--careful]",
    DESCRIPTION: "Initiates a run against a specified corporate server. " +
                "This operation costs 1 click. During a run, you will " +
                "encounter ICE that must be broken using installed programs.",
    EXAMPLES: "run R&D\nrun HQ\nrun Archives",
    SEE_ALSO: "installed"
  },
  end: {
    NAME: "end - end your current turn",
    SYNOPSIS: "end",
    DESCRIPTION: "Ends your current turn and passes to the next player. " +
                "You must discard down to your maximum hand size (5) before ending your turn.",
    EXAMPLES: "end",
    SEE_ALSO: "discard"
  },
  info: {
    NAME: "info - display game state information",
    SYNOPSIS: "info",
    DESCRIPTION: "Displays information about the current game state, " +
                "including turn number, phase, active player, and score.",
    EXAMPLES: "info",
    SEE_ALSO: "system, credits, memory"
  },
  discard: {
    NAME: "discard - discard a card from your hand",
    SYNOPSIS: "discard <card_number>",
    DESCRIPTION: "Discards a specified card from your hand. " +
                "During the action phase, this operation costs 1 click. " +
                "During the discard phase (end of turn), this operation is free.",
    EXAMPLES: "discard 3",
    SEE_ALSO: "hand, draw"
  },
  system: {
    NAME: "system - display system status",
    SYNOPSIS: "system",
    DESCRIPTION: "Displays information about your system status, " +
                "including neural interface integrity, trace detection, " +
                "and connection encryption status.",
    EXAMPLES: "system",
    SEE_ALSO: "info, memory, credits"
  },
  installed: {
    NAME: "installed - list all installed programs",
    SYNOPSIS: "installed",
    DESCRIPTION: "Displays a list of all programs currently installed on your rig. " +
                "Each entry includes the program name, type, and relevant stats.",
    EXAMPLES: "installed",
    SEE_ALSO: "install, memory"
  },
  credits: {
    NAME: "credits - display credit account information",
    SYNOPSIS: "credits",
    DESCRIPTION: "Displays information about your current credit balance, " +
                "income rate, and available credit-related actions.",
    EXAMPLES: "credits",
    SEE_ALSO: "info, memory"
  },
  memory: {
    NAME: "memory - display memory allocation information",
    SYNOPSIS: "memory",
    DESCRIPTION: "Displays information about your current memory usage, " +
                "including total available memory units (MU), used MU, " +
                "and a breakdown of memory usage by installed program.",
    EXAMPLES: "memory",
    SEE_ALSO: "installed, info, system"
  },
  jack_out: {
    NAME: "jack_out - attempt to abort the current run",
    SYNOPSIS: "jack_out",
    DESCRIPTION: "Attempts to safely disconnect from the current run. " +
                "Success chance depends on ICE type and installed programs. " +
                "Failing to jack out may result in taking damage or other consequences.",
    EXAMPLES: "jack_out",
    SEE_ALSO: "run"
  }
}; 