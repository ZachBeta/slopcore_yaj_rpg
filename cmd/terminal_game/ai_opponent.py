#!/usr/bin/env python3
"""
AI Opponent - Implements decision-making for the Corporation AI
"""

import random
from enum import Enum

class AIStrategy(Enum):
    BALANCED = 0      # Equal focus on economy, defense, and agenda advancement
    AGGRESSIVE = 1    # Focus on scoring agendas quickly, less defense
    DEFENSIVE = 2     # Focus on strong ICE defense
    ECONOMIC = 3      # Focus on building economy first, then advancing

class AIOpponent:
    """Corporation AI opponent that makes strategic decisions"""
    
    def __init__(self, random_seed=None):
        # Set random seed if provided
        if random_seed is not None:
            random.seed(random_seed)
            
        # AI state
        self.strategy = random.choice(list(AIStrategy))
        self.credits = 5
        self.clicks = 3  # Corp starts with 3 clicks
        self.hand = []
        self.installed_ice = {
            "HQ": [],
            "R&D": [],
            "Archives": []
        }
        self.remote_servers = []  # List of dictionaries representing remote servers
        self.scored_agendas = []
        self.deck = []
        self.discard = []
        
        # Debug info
        print(f"AI initialized with strategy: {self.strategy.name}")
        
    def start_turn(self):
        """Start the Corp's turn"""
        self.clicks = 3
        # Draw a card at the start of turn
        self._draw_card()
        return f"Corporation starts turn with {self.credits} credits and {len(self.hand)} cards in hand."
        
    def take_turn(self, game_state):
        """Take a full turn and return a log of actions"""
        action_log = [f"Corporation starts turn with {self.credits} credits."]
        
        # Main action loop
        while self.clicks > 0:
            # Decide what action to take based on strategy and current state
            action = self._decide_next_action(game_state)
            result = self._perform_action(action, game_state)
            action_log.append(result)
            
        # End turn processing
        discard_result = self._process_discard()
        if discard_result:
            action_log.append(discard_result)
            
        action_log.append("Corporation ends turn.")
        return action_log
        
    def _decide_next_action(self, game_state):
        """Decide the next best action based on strategy and game state"""
        
        # Priority actions regardless of strategy
        if len(self.hand) == 0 and self.clicks > 0:
            return "draw"
            
        # Basic strategic weighting
        weights = {
            "draw": 10,
            "gain_credit": 10,
            "install_ice": 0,
            "install_agenda": 0,
            "install_asset": 0,
            "advance": 0,
        }
        
        # Adjust weights based on strategy
        if self.strategy == AIStrategy.ECONOMIC:
            weights["gain_credit"] += 20
            weights["install_asset"] += 15
        elif self.strategy == AIStrategy.AGGRESSIVE:
            weights["install_agenda"] += 20
            weights["advance"] += 25
        elif self.strategy == AIStrategy.DEFENSIVE:
            weights["install_ice"] += 20
        
        # Adjust weights based on current game state
        if self.credits < 3:
            weights["gain_credit"] += 15
            weights["install_ice"] -= 5
            weights["install_agenda"] -= 5
            
        if len(self.hand) < 3:
            weights["draw"] += 15
            
        # Check for installable agendas and adjust weight
        has_agenda = any(card.get('type') == 'agenda' for card in self.hand)
        if has_agenda:
            weights["install_agenda"] += 10
            
        # Check for advanceable cards and adjust weight
        has_advanceable = len(self.remote_servers) > 0 and any(
            server.get('card', {}).get('type') == 'agenda' for server in self.remote_servers
        )
        if has_advanceable:
            weights["advance"] += 15
            
        # Choose action based on weights
        actions = []
        for action, weight in weights.items():
            if weight > 0:
                actions.extend([action] * weight)
                
        return random.choice(actions) if actions else "gain_credit"
        
    def _perform_action(self, action, game_state):
        """Perform the selected action and return a result string"""
        if action == "draw":
            if self.clicks > 0:
                self.clicks -= 1
                return self._draw_card()
        
        elif action == "gain_credit":
            if self.clicks > 0:
                self.clicks -= 1
                self.credits += 1
                return "Corporation gains 1 credit."
                
        elif action == "install_ice":
            if self.clicks > 0 and self.credits >= 1:
                self.clicks -= 1
                self.credits -= 1
                server = random.choice(list(self.installed_ice.keys()))
                return f"Corporation installs ICE protecting {server}."
                
        elif action == "install_agenda":
            if self.clicks > 0:
                self.clicks -= 1
                # Create a new remote server with an agenda
                server_num = len(self.remote_servers) + 1
                self.remote_servers.append({
                    'name': f"Remote Server {server_num}",
                    'card': {'type': 'agenda', 'advancement': 0, 'advancement_requirement': random.randint(2, 5)},
                    'ice': []
                })
                return f"Corporation installs a card in a new remote server."
                
        elif action == "install_asset":
            if self.clicks > 0:
                self.clicks -= 1
                # Create a new remote server with an asset
                server_num = len(self.remote_servers) + 1
                self.remote_servers.append({
                    'name': f"Remote Server {server_num}",
                    'card': {'type': 'asset'},
                    'ice': []
                })
                return f"Corporation installs a card in a new remote server."
                
        elif action == "advance":
            if self.clicks > 0 and self.credits >= 1 and self.remote_servers:
                # Find servers with advanceable cards
                advanceable_servers = [
                    server for server in self.remote_servers 
                    if server.get('card', {}).get('type') == 'agenda'
                ]
                
                if advanceable_servers:
                    self.clicks -= 1
                    self.credits -= 1
                    server = random.choice(advanceable_servers)
                    server['card']['advancement'] += 1
                    
                    # Check if agenda is fully advanced
                    if server['card']['advancement'] >= server['card']['advancement_requirement']:
                        points = random.choice([1, 2, 3])  # Agendas are worth 1-3 points
                        self.scored_agendas.append(points)
                        self.remote_servers.remove(server)
                        return f"Corporation advances and scores an agenda worth {points} points!"
                    
                    return f"Corporation advances a card in {server['name']}."
            
        # Default action if nothing else is possible
        if self.clicks > 0:
            self.clicks -= 1
            return "Corporation takes a basic action."
            
        return "Corporation has no valid actions."
    
    def _draw_card(self):
        """Draw a card from the deck"""
        # In a real implementation, this would draw from actual deck
        # For prototype, we'll simulate drawing generic cards
        card_types = ['ice', 'agenda', 'asset', 'operation', 'upgrade']
        new_card = {
            'type': random.choice(card_types),
            'name': f"Card-{random.randint(1000, 9999)}"
        }
        self.hand.append(new_card)
        return f"Corporation draws a card. ({len(self.hand)} cards in hand)"
    
    def _process_discard(self):
        """Handle discard at end of turn if hand size > 5"""
        max_hand_size = 5
        if len(self.hand) > max_hand_size:
            discard_count = len(self.hand) - max_hand_size
            for _ in range(discard_count):
                if self.hand:
                    discard_card = self.hand.pop()
                    self.discard.append(discard_card)
            return f"Corporation discards {discard_count} cards."
        return None

    def get_agenda_points(self):
        """Get the total agenda points scored by the Corp"""
        return sum(self.scored_agendas)
