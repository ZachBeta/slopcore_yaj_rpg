#!/usr/bin/env python3
"""
Game Board Renderer - Displays a game board using ASCII art
Based on the existing terminal game's ASCII art
"""

import shutil
import random
import sys
import os
import argparse

# Add the parent directory to sys.path to allow importing from sibling directories
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'cmd/terminal_game')))

# Import the card data and card ASCII art
from card_data import load_cards, GAME_UI_ASCII

# ANSI color codes for terminal colors
class Colors:
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    BRIGHT_BLACK = "\033[90m"
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    RESET = "\033[0m"
    BG_BLACK = "\033[40m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_YELLOW = "\033[43m"
    BG_BLUE = "\033[44m"
    BG_MAGENTA = "\033[45m"
    BG_CYAN = "\033[46m"
    BG_WHITE = "\033[47m"

# Sample cards data
sample_cards = load_cards()

# Server data for demonstration
server_data = {
    "HQ": {
        "ice": [next(card for card in sample_cards if card["name"] == "Data Wall")],
        "contents": [next(card for card in sample_cards if card["name"] == "Project Quantum"), 
                     next(card for card in sample_cards if card["name"] == "Run Exploit")]
    },
    "R&D": {
        "ice": [next(card for card in sample_cards if card["name"] == "Data Wall"), 
                next(card for card in sample_cards if card["name"] == "Digital Lockpick")],
        "contents": [next(card for card in sample_cards if card["name"] == "Neural Matrix"), 
                    next(card for card in sample_cards if card["name"] == "Quantum Protocol"), 
                    next(card for card in sample_cards if card["name"] == "Project Quantum")]
    },
    "Archives": {
        "ice": [],
        "contents": [next(card for card in sample_cards if card["name"] == "Run Exploit"), 
                     next(card for card in sample_cards if card["name"] == "Crypto Cache")]
    },
    "Server 1": {
        "ice": [next(card for card in sample_cards if card["name"] == "Digital Lockpick"), 
                next(card for card in sample_cards if card["name"] == "Digital Lockpick"), 
                next(card for card in sample_cards if card["name"] == "Data Wall")],
        "contents": [next(card for card in sample_cards if card["name"] == "Project Quantum")]
    }
}

def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def get_card_color(card_type):
    """Return ANSI color code based on card type"""
    type_color = Colors.RESET
    if card_type.lower() == "program":
        type_color = Colors.BRIGHT_CYAN
    elif card_type.lower() == "hardware":
        type_color = Colors.BRIGHT_YELLOW
    elif card_type.lower() == "resource":
        type_color = Colors.BRIGHT_GREEN
    elif card_type.lower() == "event":
        type_color = Colors.BRIGHT_MAGENTA
    elif card_type.lower() == "virus":
        type_color = Colors.BRIGHT_RED
    elif card_type.lower() == "icebreaker":
        type_color = Colors.BRIGHT_BLUE
    elif card_type.lower() == "ice":
        type_color = Colors.BRIGHT_RED
    elif card_type.lower() == "operation":
        type_color = Colors.BRIGHT_BLUE
    elif card_type.lower() == "asset":
        type_color = Colors.BRIGHT_YELLOW
    elif card_type.lower() == "upgrade":
        type_color = Colors.BRIGHT_GREEN
    elif card_type.lower() == "agenda":
        type_color = Colors.BRIGHT_MAGENTA
    return type_color

def display_mini_card(card, width=20):
    """Render a mini card with ASCII art"""
    card_type = card.get('type', 'unknown').lower()
    name = card.get('name', 'Unknown')
    cost = card.get('cost', 0)
    
    # Get card color
    type_color = get_card_color(card_type)
    
    # Get card art directly from the card object
    art_lines = card.get('ascii_art', [])
    
    # Adjust width based on name length (minimum 20)
    card_width = max(width, len(name) + 4)
    
    # Card lines to return
    card_lines = []
    
    # Top of card
    card_lines.append(f"{type_color}╔{'═' * card_width}╗{Colors.RESET}")
    
    # Card name
    card_lines.append(f"{type_color}║{Colors.BOLD} {name}{' ' * (card_width - len(name) - 1)}{Colors.RESET}{type_color}║{Colors.RESET}")
    
    # Card type
    subtype = card.get('subtype', '')
    type_text = f"{card_type.capitalize()}{': ' + subtype if subtype else ''}"
    card_lines.append(f"{type_color}║ {type_text}{' ' * (card_width - len(type_text) - 2)}║{Colors.RESET}")
    
    # Display ASCII art if available
    if art_lines:
        for line in art_lines:
            padding = max(0, (card_width - len(line)) // 2)
            card_lines.append(f"{type_color}║{' ' * padding}{line}{' ' * (card_width - len(line) - padding)}║{Colors.RESET}")
    
    # Display cost and other stats based on card type
    stats_line = f" Cost: {cost}"
    if 'mu' in card and card['mu'] > 0:
        stats_line += f" | MU: {card['mu']}"
    if 'strength' in card:
        stats_line += f" | STR: {card['strength']}"
    if 'agenda_points' in card:
        stats_line += f" | Points: {card['agenda_points']}"
    
    if len(stats_line) > card_width - 2:
        stats_line = stats_line[:card_width - 5] + "..."
        
    card_lines.append(f"{type_color}║{stats_line}{' ' * (card_width - len(stats_line) - 1)}║{Colors.RESET}")
    
    # Bottom of card
    card_lines.append(f"{type_color}╚{'═' * card_width}╝{Colors.RESET}")
    
    return card_lines

def merge_horizontally(lists_of_lines):
    """Merge multiple lists of lines horizontally"""
    if not lists_of_lines:
        return []
        
    max_height = max(len(lines) for lines in lists_of_lines)
    result = []
    
    # Padding each list to max height
    padded_lists = []
    for lines in lists_of_lines:
        padding_needed = max_height - len(lines)
        padded = lines + [""] * padding_needed
        padded_lists.append(padded)
    
    # Merging lines
    for i in range(max_height):
        merged_line = ""
        for lines in padded_lists:
            merged_line += lines[i] + "  "
        result.append(merged_line)
    
    return result

def display_servers(servers, current_run=None):
    """Display corporate servers with their ICE and contents"""
    print(f"\n{Colors.BRIGHT_WHITE}{Colors.BOLD}CORPORATE SERVERS{Colors.RESET}")
    print(f"{Colors.BRIGHT_BLACK}{'=' * 80}{Colors.RESET}\n")
    
    for server_name, server in servers.items():
        # Highlight server if it's being run on
        if current_run and current_run['server'] == server_name:
            highlight = Colors.BG_BLUE + Colors.BRIGHT_WHITE + Colors.BOLD
            print(f"{highlight}[ {server_name} - CURRENTLY RUNNING ]{Colors.RESET}")
            
            # Display run progress
            display_run_progress(server['ice'], current_run['ice_index'], server_name)
        else:
            print(f"{Colors.YELLOW}{Colors.BOLD}[ {server_name} ]{Colors.RESET}")
        
        # Display ICE protecting the server
        if server['ice']:
            ice_cards = [display_mini_card(ice) for ice in server['ice']]
            print("\n".join(merge_horizontally(ice_cards)))
            print(f"{Colors.BRIGHT_BLACK}{'- ' * 40}{Colors.RESET}")
        else:
            print(f"{Colors.BRIGHT_GREEN}No ICE protecting this server{Colors.RESET}")
            print(f"{Colors.BRIGHT_BLACK}{'- ' * 40}{Colors.RESET}")
        
        # Indicate server contents (but don't show details for hidden cards)
        if server['contents']:
            content_count = len(server['contents'])
            print(f"{Colors.BRIGHT_BLUE}Server contains {content_count} cards{Colors.RESET}\n")
        else:
            print(f"{Colors.BRIGHT_BLACK}Server is empty{Colors.RESET}\n")
        
        print()

def display_runner_area(runner_cards):
    """Display runner's installed cards and hand"""
    print(f"\n{Colors.BRIGHT_WHITE}{Colors.BOLD}RUNNER'S RIG{Colors.RESET}")
    print(f"{Colors.BRIGHT_BLACK}{'=' * 80}{Colors.RESET}\n")
    
    # Group cards by type
    programs = [c for c in runner_cards if c.get('type').lower() in ['program']]
    icebreakers = [c for c in runner_cards if c.get('subtype', '').lower() == 'icebreaker']
    hardware = [c for c in runner_cards if c.get('type').lower() == 'hardware']
    resources = [c for c in runner_cards if c.get('type').lower() == 'resource']
    
    # Display icebreakers
    if icebreakers:
        print(f"{Colors.BRIGHT_BLUE}{Colors.BOLD}ICEBREAKERS:{Colors.RESET}")
        icebreaker_cards = [display_mini_card(prog) for prog in icebreakers]
        print("\n".join(merge_horizontally(icebreaker_cards)))
        print()
        
    # Display programs
    if programs:
        print(f"{Colors.BRIGHT_CYAN}{Colors.BOLD}PROGRAMS:{Colors.RESET}")
        program_cards = [display_mini_card(prog) for prog in programs if 'icebreaker' not in prog.get('subtype', '').lower()]
        print("\n".join(merge_horizontally(program_cards)))
        print()
    
    # Display hardware
    if hardware:
        print(f"{Colors.BRIGHT_YELLOW}{Colors.BOLD}HARDWARE:{Colors.RESET}")
        hardware_cards = [display_mini_card(hw) for hw in hardware]
        print("\n".join(merge_horizontally(hardware_cards)))
        print()
    
    # Display resources
    if resources:
        print(f"{Colors.BRIGHT_GREEN}{Colors.BOLD}RESOURCES:{Colors.RESET}")
        resource_cards = [display_mini_card(res) for res in resources]
        print("\n".join(merge_horizontally(resource_cards)))
        print()

def display_status_bar(credits, memory, clicks):
    """Display runner status information"""
    terminal_width = shutil.get_terminal_size().columns
    
    status_text = f"Credits: {credits} │ Memory: {memory[0]}/{memory[1]} MU │ Clicks: {clicks}"
    
    padding = " " * ((terminal_width - len(status_text)) // 2)
    
    print(f"{Colors.BG_BLUE}{Colors.BRIGHT_WHITE}{padding}{status_text}{padding}{Colors.RESET}")
    print()

def display_logo():
    """Display the game logo"""
    for line in GAME_UI_ASCII["logo"]:
        print(f"{Colors.BRIGHT_CYAN}{line}{Colors.RESET}")
    print()

def display_run_progress(ice_encountered, current_ice_index, server_name):
    """Display a visual representation of the progress through a run"""
    total_ice = len(ice_encountered)
    if total_ice == 0:
        # No ICE on this server
        print(f"{Colors.BRIGHT_GREEN}No ICE protecting {server_name}. Direct access!{Colors.RESET}")
        return
        
    # Calculate progress
    passed_ice = current_ice_index
    remaining_ice = total_ice - passed_ice - 1
    
    # Header
    print(f"\n{Colors.BRIGHT_BLUE}RUN PROGRESS: {Colors.RESET}{passed_ice}/{total_ice} ICE passed")
    
    # Print the starting point (Runner)
    print(f"{Colors.BRIGHT_MAGENTA}[RUNNER]", end="")
    
    # Print passed ICE
    for i in range(passed_ice):
        ice_color = Colors.BRIGHT_GREEN
        print(f"{Colors.BRIGHT_BLACK}==={Colors.RESET}{ice_color}[X]{Colors.RESET}", end="")
        
    # Print current ICE (if any)
    if current_ice_index < total_ice:
        ice = ice_encountered[current_ice_index]
        ice_str = f"[!]"  # Default representation
        ice_color = Colors.BRIGHT_RED
        print(f"{Colors.BRIGHT_BLACK}==={Colors.RESET}{ice_color}{ice_str}{Colors.RESET}", end="")
        
        # Print remaining ICE
        for i in range(current_ice_index + 1, total_ice):
            print(f"{Colors.BRIGHT_BLACK}===[ ]{Colors.RESET}", end="")
    
    # Print the server
    print(f"{Colors.BRIGHT_BLACK}==={Colors.RESET}{Colors.BRIGHT_CYAN}[{server_name}]{Colors.RESET}")
    
    # Show legend
    print(f"{Colors.BRIGHT_GREEN}[X]{Colors.RESET} = Passed ICE   " +
          f"{Colors.BRIGHT_RED}[!]{Colors.RESET} = Current ICE   " +
          f"{Colors.BRIGHT_BLACK}[ ]{Colors.RESET} = Upcoming ICE\n")

def display_ice_encounter(ice_card):
    """Display an ice encounter during a run"""
    print(f"\n{Colors.BRIGHT_RED}{Colors.BOLD}!!! ICE ENCOUNTERED !!!{Colors.RESET}")
    print(f"{Colors.BRIGHT_BLACK}{'=' * 80}{Colors.RESET}\n")
    
    card_lines = display_mini_card(ice_card, width=30)
    
    # Display ice card
    for line in card_lines:
        print(line)
    
    print(f"\n{Colors.BRIGHT_WHITE}You must break the ICE subroutines to continue!{Colors.RESET}")
    print(f"{Colors.BRIGHT_YELLOW}Use your icebreaker programs to break through.{Colors.RESET}\n")

def display_run_success(server_name):
    """Display successful run animation"""
    print(f"\n{Colors.BRIGHT_GREEN}{Colors.BOLD}!!! RUN SUCCESSFUL !!!{Colors.RESET}")
    print(f"{Colors.BRIGHT_BLACK}{'=' * 80}{Colors.RESET}\n")
    
    # Display run ASCII art
    for line in GAME_UI_ASCII["run"]:
        print(f"{Colors.BRIGHT_GREEN}{line}{Colors.RESET}")
    
    print(f"\n{Colors.BRIGHT_WHITE}You have successfully accessed {server_name}!{Colors.RESET}")
    print(f"{Colors.BRIGHT_YELLOW}You may now access cards in this server.{Colors.RESET}\n")

def display_hand(hand_cards):
    """Display cards in hand"""
    print(f"\n{Colors.BRIGHT_WHITE}{Colors.BOLD}YOUR HAND:{Colors.RESET}")
    print(f"{Colors.BRIGHT_BLACK}{'=' * 80}{Colors.RESET}\n")
    
    hand_display = [display_mini_card(card) for card in hand_cards]
    print("\n".join(merge_horizontally(hand_display)))
    print()

def display_board(options=None):
    """Display the full game board"""
    if not options:
        options = {}
    
    clear_screen()
    
    # Display logo
    display_logo()
    
    # Display runner status
    display_status_bar(
        credits=options.get('credits', 5),
        memory=options.get('memory', [3, 4]),
        clicks=options.get('clicks', 2)
    )
    
    # Set up current run if specified
    current_run = None
    if options.get('run_server'):
        current_run = {
            'server': options['run_server'],
            'ice_index': options.get('ice_index', 0)
        }
    
    # Display Corp servers
    display_servers(server_data, current_run)
    
    # Display Runner's area
    default_installed = [
        next(card for card in sample_cards if card["name"] == "Icebreaker.exe"),
        next(card for card in sample_cards if card["name"] == "Neural Matrix"),
        next(card for card in sample_cards if card["name"] == "Quantum Protocol"),
        next(card for card in sample_cards if card["name"] == "Crypto Cache"),
    ]
    
    runner_installed = options.get('installed_cards', default_installed)
    display_runner_area(runner_installed)
    
    # Display hand cards
    default_hand = [
        next(card for card in sample_cards if card["name"] == "Run Exploit"),
        next(card for card in sample_cards if card["name"] == "Memory Chip"),
        next(card for card in sample_cards if card["name"] == "Net Shield"),
    ]
    hand_cards = options.get('hand_cards', default_hand)
    display_hand(hand_cards)
    
    # Display ice encounter if in a run
    if options.get('ice_encounter') and current_run:
        ice_index = current_run['ice_index']
        server = current_run['server']
        if ice_index < len(server_data[server]['ice']):
            display_ice_encounter(server_data[server]['ice'][ice_index])
    
    # Display run success if specified
    if options.get('run_success'):
        display_run_success(options.get('run_server', 'Server'))

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description='Display ASCII art game board')
    parser.add_argument('--run', choices=['hq', 'r&d', 'archives', 'server1'], 
                      help='Show a run in progress on the specified server')
    parser.add_argument('--ice-index', type=int, default=0, 
                      help='Current ICE index in the run (0-based)')
    parser.add_argument('--credits', type=int, default=5,
                      help='Number of credits the runner has')
    parser.add_argument('--memory', type=int, nargs=2, default=[3, 4],
                      help='Memory usage and capacity (e.g. --memory 3 4)')
    parser.add_argument('--clicks', type=int, default=2,
                      help='Number of clicks remaining')
    parser.add_argument('--ice-encounter', action='store_true',
                      help='Show ice encounter dialog')
    parser.add_argument('--run-success', action='store_true',
                      help='Show run success animation')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    
    # Process command-line arguments
    options = {}
    
    # Map server names from command line to actual server names
    server_map = {
        'hq': 'HQ',
        'r&d': 'R&D',
        'archives': 'Archives',
        'server1': 'Server 1'
    }
    
    if args.run:
        options['run_server'] = server_map.get(args.run)
        options['ice_index'] = args.ice_index
    
    options['credits'] = args.credits
    options['memory'] = args.memory
    options['clicks'] = args.clicks
    options['ice_encounter'] = args.ice_encounter
    options['run_success'] = args.run_success
    
    display_board(options) 