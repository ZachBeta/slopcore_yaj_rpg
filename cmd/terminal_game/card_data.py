#!/usr/bin/env python3
"""
Card Data - Provides sample cards for the terminal game
"""

def load_cards():
    """
    Load a set of sample cards for the terminal game
    
    In a real implementation, this would load from JSON files or a database
    For now, we just return a hardcoded list of sample cards
    """
    sample_cards = [
        {
            "name": "Icebreaker.exe",
            "type": "Program",
            "cost": 3,
            "mu": 1,
            "strength": 2,
            "description": "Break ice subroutines with strength <= 2",
            "ability": {
                "type": "break_ice",
                "ice_types": ["all"],
                "max_strength": 2,
                "subroutines": "unlimited"
            }
        },
        {
            "name": "Neural Matrix",
            "type": "Hardware",
            "cost": 2,
            "mu": 0,
            "description": "+2 Memory Units",
            "ability": {
                "type": "permanent",
                "effect": "increase_memory",
                "value": 2
            }
        },
        {
            "name": "Quantum Protocol",
            "type": "Program",
            "cost": 4,
            "mu": 2,
            "strength": 4,
            "description": "Break up to 3 subroutines on a single piece of ice",
            "ability": {
                "type": "break_ice",
                "ice_types": ["all"],
                "max_strength": 4,
                "subroutines": 3
            }
        },
        {
            "name": "Crypto Cache",
            "type": "Resource",
            "cost": 2,
            "mu": 0,
            "description": "Gain 1 credit at the start of your turn",
            "ability": {
                "type": "trigger",
                "trigger": "turn_start",
                "effect": "gain_credits",
                "value": 1
            }
        },
        {
            "name": "Run Exploit",
            "type": "Event",
            "cost": 2,
            "mu": 0,
            "description": "Bypass the first piece of ice encountered during a run",
            "ability": {
                "type": "one_time",
                "effect": "bypass_ice",
                "count": 1
            }
        },
        {
            "name": "Memory Chip",
            "type": "Hardware",
            "cost": 1,
            "mu": 0,
            "description": "+1 Memory Unit",
            "ability": {
                "type": "permanent",
                "effect": "increase_memory",
                "value": 1
            }
        },
        {
            "name": "Net Shield",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "description": "Prevent the first point of net damage each turn",
            "ability": {
                "type": "trigger",
                "trigger": "damage",
                "damage_type": "net",
                "effect": "prevent_damage",
                "value": 1,
                "frequency": "per_turn"
            }
        },
        {
            "name": "Backdoor Method",
            "type": "Event",
            "cost": 3,
            "mu": 0,
            "description": "Make a run on any server. If successful, gain 2 credits",
            "ability": {
                "type": "one_time",
                "effect": "run",
                "target": "any",
                "success_effect": "gain_credits",
                "success_value": 2
            }
        },
        {
            "name": "Ghost Runner",
            "type": "Program",
            "cost": 3,
            "mu": 1,
            "strength": 1,
            "description": "Break stealth ice subroutines",
            "ability": {
                "type": "break_ice",
                "ice_types": ["stealth"],
                "max_strength": 1,
                "subroutines": "unlimited"
            }
        },
        {
            "name": "Tactical Uplink",
            "type": "Hardware",
            "cost": 4,
            "mu": 0,
            "description": "Once per turn, draw 1 card when you make a successful run",
            "ability": {
                "type": "trigger",
                "trigger": "successful_run",
                "effect": "draw",
                "value": 1,
                "frequency": "per_turn"
            }
        },
        {
            "name": "Cyberdeck Extension",
            "type": "Hardware",
            "cost": 3,
            "mu": 0,
            "description": "+2 Memory Units and +1 hand size",
            "ability": {
                "type": "permanent",
                "effects": [
                    {"effect": "increase_memory", "value": 2},
                    {"effect": "increase_hand_size", "value": 1}
                ]
            }
        },
        {
            "name": "Data Siphon",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "description": "When a successful run ends, draw 1 card",
            "ability": {
                "type": "trigger",
                "trigger": "successful_run",
                "effect": "draw",
                "value": 1
            }
        },
        {
            "name": "Stealth Protocol",
            "type": "Event",
            "cost": 1,
            "mu": 0,
            "description": "The next run you make this turn is untraceble",
            "ability": {
                "type": "one_time",
                "effect": "untraceable_run",
                "duration": "next_run_this_turn"
            }
        },
        {
            "name": "Digital Lockpick",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "strength": 3,
            "description": "Break barrier ice subroutines",
            "ability": {
                "type": "break_ice",
                "ice_types": ["barrier"],
                "max_strength": 3,
                "subroutines": "unlimited"
            }
        },
        {
            "name": "Credit Cache",
            "type": "Resource",
            "cost": 0,
            "mu": 0,
            "description": "Place 3 credits on this card when installed. Use these credits for installing programs",
            "ability": {
                "type": "resource",
                "resource_type": "credits",
                "value": 3,
                "usage": "install_programs"
            }
        }
    ]
    
    return sample_cards
