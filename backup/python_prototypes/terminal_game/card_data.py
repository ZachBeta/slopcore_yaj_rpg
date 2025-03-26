#!/usr/bin/env python3
"""
Card Data - Provides sample cards for the terminal game including ASCII art representations
"""

import sys
import os

# Add the parent directory to sys.path to allow importing from sibling directories
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# ASCII Art for different card types
CARD_ASCII_ART = {
    "program": [
        r"    _____",
        r"   /    /|",
        r"  /____/ |",
        r" |    |  |",
        r" |____|/   "
    ],
    "icebreaker": [
        r"   /|  /|",
        r"  /_|_/ |",
        r" |     /|",
        r" |__/|/ |",
        r" |  ||  |",
        r" |__|/   "
    ],
    "hardware": [
        r"  _______",
        r" /       \\",
        r"|  o   o  |",
        r"|    |    |",
        r"|___|___|_|"
    ],
    "resource": [
        r"    $$$    ",
        r"   $   $   ",
        r"   $   $   ",
        r"   $   $   ",
        r"    $$$    "
    ],
    "event": [
        r"    /\\    ",
        r"   /  \\   ",
        r"  /    \\  ",
        r" +------+ ",
        r" |      | "
    ],
    "virus": [
        r"    ()    ",
        r"   /\\/\\   ",
        r"  <(  )>  ",
        r"   \\\\//   ",
        r"    \\/    "
    ],
    "operation": [
        r"   __/\\__   ",
        r"  /      \\  ",
        r" |   >>   | ",
        r"  \\______/  ",
        r"    |  |    "
    ],
    "asset": [
        r"    _____    ",
        r"   |     |   ",
        r"   |  █  |   ",
        r"   |_____|   ",
        r"   /  |  \\   "
    ],
    "ice": [
        r" +-----------------+",
        r" |    FIREWALL     |",
        r" +-----------------+",
        r" | [====||====]    |",
        r" | [====||====]    |",
        r" | [====||====]    |",
        r" +-----------------+"
    ],
    "agenda": [
        r"   ★★★★★   ",
        r"  ★     ★  ",
        r" ★       ★ ",
        r"  ★     ★  ",
        r"   ★★★★★   "
    ],
    "upgrade": [
        r"   ▲▲▲▲   ",
        r"  ▲    ▲  ",
        r" ▲      ▲ ",
        r"▲▲▲▲▲▲▲▲▲▲"
    ]
}

# Game UI ASCII Art
GAME_UI_ASCII = {
    "logo": [
        r"  _   _                   ____                 _                           ",
        r" | \ | | ___  ___  _ __  |  _ \  ___  _ __ ___(_)_ __   __ _ _ __   ___ ___",
        r" |  \| |/ _ \/ _ \| '_ \ | | | |/ _ \| '_ \_  / | '_ \ / _` | '_ \ / __/ _ \\",
        r" | |\  |  __/ (_) | | | || |_| | (_) | | | / /| | | | | (_| | | | | (_|  __/",
        r" |_| \_|\___|\___/|_| |_||____/ \___/|_| |/_/ |_|_| |_|\__,_|_| |_|\___\___|",
        r"                                                                            "
    ],
    "runner": [
        r"  _____                            ",
        r" |  __ \                           ",
        r" | |__) |_   _ _ __  _ __   ___ _ __",
        r" |  _  /| | | | '_ \| '_ \ / _ \ '__|",
        r" | | \ \| |_| | | | | | | |  __/ |   ",
        r" |_|  \_\\__,_|_| |_|_| |_|\___|_|   ",
        r"                                    "
    ],
    "corp": [
        r"   _____                                    _   _             ",
        r"  / ____|                                  | | (_)            ",
        r" | |     ___  _ __ _ __   ___  _ __ __ _| |_ _  ___  _ __  ",
        r" | |    / _ \| '__| '_ \ / _ \| '__/ _` | __| |/ _ \| '_ \ ",
        r" | |___| (_) | |  | |_) | (_) | | | (_| | |_| | (_) | | | |",
        r"  \_____\___/|_|  | .__/ \___/|_|  \__,_|\__|_|\___/|_| |_|",
        r"                  | |                                       ",
        r"                  |_|                                       "
    ],
    "run": [
        r" _______ _______ _______ _______ _______ _______ _______ ",
        r" |\     /|\     /|\     /|\     /|\     /|\     /|\     /|",
        r" | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ |",
        r" | |   | | |   | | |   | | |   | | |   | | |   | | |   | |",
        r" | |R  | | |U  | | |N  | | |N  | | |I  | | |N  | | |G  | |",
        r" | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ |",
        r" |/_____\|/_____\|/_____\|/_____\|/_____\|/_____\|/_____\|",
        r"                                                          "
    ]
}

# Custom ASCII art for specific cards
SPECIFIC_CARD_ART = {
    "Icebreaker.exe": [
        r"   ░░░░░   ",
        r"  ░█▀▀▀█░  ",
        r" ░█░ ░ ░█░ ",
        r" ░█░ ░ ░█░ ",
        r"  ░█▄▄▄█░  ",
        r"   ░░░░░   "
    ],
    "Neural Matrix": [
        r"  ┌─┐┌─┐┌─┐ ",
        r"  │ ││ ││ │ ",
        r"  ├─┘├─┘├─┘ ",
        r"  │▞▀│▞▀│▞▀ ",
        r"  └─┘└─┘└─┘ "
    ],
    "Crypto Cache": [
        r"   ╭───╮   ",
        r"  ╭│╲$╱│╮  ",
        r"  │╰─┬─╯│  ",
        r"  ╰──┴──╯  "
    ],
    "Data Wall": [
        r" ┏━━━━━━━━┓ ",
        r" ┃■■■■■■■■┃ ",
        r" ┃■■■■■■■■┃ ",
        r" ┃■■■■■■■■┃ ",
        r" ┗━━━━━━━━┛ "
    ]
}

def load_cards():
    """
    Load a set of sample cards for the terminal game
    
    Each card includes stats, mechanics, ASCII art, and flavor text
    """
    sample_cards = [
        {
            "name": "Icebreaker.exe",
            "type": "Program",
            "subtype": "Icebreaker",
            "cost": 3,
            "mu": 1,
            "strength": 2,
            "description": "Break ice subroutines with strength <= 2",
            "flavor_text": "The digital lockpick that turns firewalls into safety nets.",
            "ability": {
                "type": "break_ice",
                "ice_types": ["all"],
                "max_strength": 2,
                "subroutines": "unlimited"
            },
            "ascii_art": [
                r"   ░░░░░   ",
                r"  ░█▀▀▀█░  ",
                r" ░█░ ░ ░█░ ",
                r" ░█░ ░ ░█░ ",
                r"  ░█▄▄▄█░  ",
                r"   ░░░░░   "
            ]
        },
        {
            "name": "Neural Matrix",
            "type": "Hardware",
            "cost": 2,
            "mu": 0,
            "description": "+2 Memory Units",
            "flavor_text": "Expand your mind. Literally.",
            "ability": {
                "type": "permanent",
                "effect": "increase_memory",
                "value": 2
            },
            "ascii_art": [
                r"  ┌─┐┌─┐┌─┐ ",
                r"  │ ││ ││ │ ",
                r"  ├─┘├─┘├─┘ ",
                r"  │▞▀│▞▀│▞▀ ",
                r"  └─┘└─┘└─┘ "
            ]
        },
        {
            "name": "Quantum Protocol",
            "type": "Program",
            "cost": 4,
            "mu": 2,
            "strength": 4,
            "description": "Break up to 3 subroutines on a single piece of ice",
            "flavor_text": "Advanced algorithm that shatters digital barriers.",
            "ability": {
                "type": "break_ice",
                "ice_types": ["all"],
                "max_strength": 4,
                "subroutines": 3
            },
            "ascii_art": [
                r"    _____",
                r"   /    /|",
                r"  /____/ |",
                r" |    |  |",
                r" |____|/   "
            ]
        },
        {
            "name": "Crypto Cache",
            "type": "Resource",
            "cost": 2,
            "mu": 0,
            "description": "Gain 1 credit at the start of your turn",
            "flavor_text": "Hidden funds for rainy days in cyberspace.",
            "ability": {
                "type": "trigger",
                "trigger": "turn_start",
                "effect": "gain_credits",
                "value": 1
            },
            "ascii_art": [
                r"   ╭───╮   ",
                r"  ╭│╲$╱│╮  ",
                r"  │╰─┬─╯│  ",
                r"  ╰──┴──╯  "
            ]
        },
        {
            "name": "Run Exploit",
            "type": "Event",
            "cost": 2,
            "mu": 0,
            "description": "Bypass the first piece of ice encountered during a run",
            "flavor_text": "Sometimes the best approach is no approach at all.",
            "ability": {
                "type": "one_time",
                "effect": "bypass_ice",
                "count": 1
            },
            "ascii_art": [
                r"    /\\    ",
                r"   /  \\   ",
                r"  /    \\  ",
                r" +------+ ",
                r" |      | "
            ]
        },
        {
            "name": "Memory Chip",
            "type": "Hardware",
            "cost": 1,
            "mu": 0,
            "description": "+1 Memory Unit",
            "flavor_text": "Small but essential.",
            "ability": {
                "type": "permanent",
                "effect": "increase_memory",
                "value": 1
            },
            "ascii_art": [
                r"  _______",
                r" /       \\",
                r"|  o   o  |",
                r"|    |    |",
                r"|___|___|_|"
            ]
        },
        {
            "name": "Net Shield",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "description": "Prevent the first point of net damage each turn",
            "flavor_text": "It won't stop bullets, but it will stop bits.",
            "ability": {
                "type": "trigger",
                "trigger": "damage",
                "damage_type": "net",
                "effect": "prevent_damage",
                "value": 1,
                "frequency": "per_turn"
            },
            "ascii_art": [
                r"    _____",
                r"   /    /|",
                r"  /____/ |",
                r" |    |  |",
                r" |____|/   "
            ]
        },
        {
            "name": "Backdoor Method",
            "type": "Event",
            "cost": 3,
            "mu": 0,
            "description": "Make a run on any server. If successful, gain 2 credits",
            "flavor_text": "The shortest path between two points is usually unauthorized.",
            "ability": {
                "type": "one_time",
                "effect": "run",
                "target": "any",
                "success_effect": "gain_credits",
                "success_value": 2
            },
            "ascii_art": [
                r"    /\\    ",
                r"   /  \\   ",
                r"  /    \\  ",
                r" +------+ ",
                r" |      | "
            ]
        },
        {
            "name": "Ghost Runner",
            "type": "Program",
            "subtype": "Icebreaker",
            "cost": 3,
            "mu": 1,
            "strength": 1,
            "description": "Break stealth ice subroutines",
            "flavor_text": "Can't catch what you can't see.",
            "ability": {
                "type": "break_ice",
                "ice_types": ["stealth"],
                "max_strength": 1,
                "subroutines": "unlimited"
            },
            "ascii_art": [
                r"   /|  /|",
                r"  /_|_/ |",
                r" |     /|",
                r" |__/|/ |",
                r" |  ||  |",
                r" |__|/   "
            ]
        },
        {
            "name": "Tactical Uplink",
            "type": "Hardware",
            "cost": 4,
            "mu": 0,
            "description": "Once per turn, draw 1 card when you make a successful run",
            "flavor_text": "Knowledge is power, information is currency.",
            "ability": {
                "type": "trigger",
                "trigger": "successful_run",
                "effect": "draw",
                "value": 1,
                "frequency": "per_turn"
            },
            "ascii_art": [
                r"  _______",
                r" /       \\",
                r"|  o   o  |",
                r"|    |    |",
                r"|___|___|_|"
            ]
        },
        {
            "name": "Cyberdeck Extension",
            "type": "Hardware",
            "cost": 3,
            "mu": 0,
            "description": "+2 Memory Units and +1 hand size",
            "flavor_text": "Max out your mental capacity. Side effects may include headaches.",
            "ability": {
                "type": "permanent",
                "effects": [
                    {"effect": "increase_memory", "value": 2},
                    {"effect": "increase_hand_size", "value": 1}
                ]
            },
            "ascii_art": [
                r"  _______",
                r" /       \\",
                r"|  o   o  |",
                r"|    |    |",
                r"|___|___|_|"
            ]
        },
        {
            "name": "Data Siphon",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "description": "When a successful run ends, draw 1 card",
            "flavor_text": "Take more than just their data.",
            "ability": {
                "type": "trigger",
                "trigger": "successful_run",
                "effect": "draw",
                "value": 1
            },
            "ascii_art": [
                r"    _____",
                r"   /    /|",
                r"  /____/ |",
                r" |    |  |",
                r" |____|/   "
            ]
        },
        {
            "name": "Stealth Protocol",
            "type": "Event",
            "cost": 1,
            "mu": 0,
            "description": "The next run you make this turn is untraceable",
            "flavor_text": "Leave no footprints in the digital snow.",
            "ability": {
                "type": "one_time",
                "effect": "untraceable_run",
                "duration": "next_run_this_turn"
            },
            "ascii_art": [
                r"    /\\    ",
                r"   /  \\   ",
                r"  /    \\  ",
                r" +------+ ",
                r" |      | "
            ]
        },
        {
            "name": "Digital Lockpick",
            "type": "Program",
            "subtype": "Icebreaker",
            "cost": 2,
            "mu": 1,
            "strength": 3,
            "description": "Break barrier ice subroutines",
            "flavor_text": "No wall is impenetrable with the right tools.",
            "ability": {
                "type": "break_ice",
                "ice_types": ["barrier"],
                "max_strength": 3,
                "subroutines": "unlimited"
            },
            "ascii_art": [
                r"   /|  /|",
                r"  /_|_/ |",
                r" |     /|",
                r" |__/|/ |",
                r" |  ||  |",
                r" |__|/   "
            ]
        },
        {
            "name": "Credit Cache",
            "type": "Resource",
            "cost": 0,
            "mu": 0,
            "description": "Place 3 credits on this card when installed. Use these credits for installing programs",
            "flavor_text": "A digital piggy bank for your coding expenditures.",
            "ability": {
                "type": "resource",
                "resource_type": "credits",
                "value": 3,
                "usage": "install_programs"
            },
            "ascii_art": [
                r"    $$$    ",
                r"   $   $   ",
                r"   $   $   ",
                r"   $   $   ",
                r"    $$$    "
            ]
        },
        {
            "name": "Data Wall",
            "type": "Ice",
            "subtype": "Barrier",
            "cost": 3,
            "strength": 4,
            "description": "End the run unless the runner spends 2 credits",
            "flavor_text": "Sometimes the simplest solutions are the most effective.",
            "subroutines": [
                {"text": "End the run unless the runner spends 2 credits", "effect": "end_run_or_pay", "cost": 2}
            ],
            "ascii_art": [
                r" ┏━━━━━━━━┓ ",
                r" ┃■■■■■■■■┃ ",
                r" ┃■■■■■■■■┃ ",
                r" ┃■■■■■■■■┃ ",
                r" ┗━━━━━━━━┛ "
            ]
        },
        {
            "name": "Project Quantum",
            "type": "Agenda",
            "advancement_cost": 4,
            "agenda_points": 2,
            "description": "When scored, gain 3 credits",
            "flavor_text": "The future is now. And it's expensive.",
            "ability": {
                "type": "on_score",
                "effect": "gain_credits",
                "value": 3
            },
            "ascii_art": [
                r"   ★★★★★   ",
                r"  ★     ★  ",
                r" ★       ★ ",
                r"  ★     ★  ",
                r"   ★★★★★   "
            ]
        }
    ]
    
    return sample_cards
