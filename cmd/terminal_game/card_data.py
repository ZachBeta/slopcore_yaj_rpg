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
            "description": "Break ice subroutines with strength <= 2"
        },
        {
            "name": "Neural Matrix",
            "type": "Hardware",
            "cost": 2,
            "mu": 0,
            "description": "+2 Memory Units"
        },
        {
            "name": "Quantum Protocol",
            "type": "Program",
            "cost": 4,
            "mu": 2,
            "strength": 4,
            "description": "Break up to 3 subroutines on a single piece of ice"
        },
        {
            "name": "Crypto Cache",
            "type": "Resource",
            "cost": 2,
            "mu": 0,
            "description": "Gain 1 credit at the start of your turn"
        },
        {
            "name": "Run Exploit",
            "type": "Event",
            "cost": 2,
            "mu": 0,
            "description": "Bypass the first piece of ice encountered during a run"
        },
        {
            "name": "Memory Chip",
            "type": "Hardware",
            "cost": 1,
            "mu": 0,
            "description": "+1 Memory Unit"
        },
        {
            "name": "Net Shield",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "description": "Prevent the first point of net damage each turn"
        },
        {
            "name": "Backdoor Method",
            "type": "Event",
            "cost": 3,
            "mu": 0,
            "description": "Make a run on any server. If successful, gain 2 credits"
        },
        {
            "name": "Ghost Runner",
            "type": "Program",
            "cost": 3,
            "mu": 1,
            "strength": 1,
            "description": "Break stealth ice subroutines"
        },
        {
            "name": "Tactical Uplink",
            "type": "Hardware",
            "cost": 4,
            "mu": 0,
            "description": "Once per turn, draw 1 card when you make a successful run"
        },
        {
            "name": "Cyberdeck Extension",
            "type": "Hardware",
            "cost": 3,
            "mu": 0,
            "description": "+2 Memory Units and +1 hand size"
        },
        {
            "name": "Data Siphon",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "description": "When a successful run ends, draw 1 card"
        },
        {
            "name": "Stealth Protocol",
            "type": "Event",
            "cost": 1,
            "mu": 0,
            "description": "The next run you make this turn is untraceble"
        },
        {
            "name": "Digital Lockpick",
            "type": "Program",
            "cost": 2,
            "mu": 1,
            "strength": 3,
            "description": "Break barrier ice subroutines"
        },
        {
            "name": "Credit Cache",
            "type": "Resource",
            "cost": 0,
            "mu": 0,
            "description": "Place 3 credits on this card when installed. Use these credits for installing programs"
        }
    ]
    
    return sample_cards
