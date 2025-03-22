extends Control

# Game state
var deck_manager: DeckManager
var player_credits: int = 5
var memory_units_available: int = 4
var memory_units_used: int = 0
var selected_hand_card_index: int = -1
var player_side: String = "runner"  # or "corp"
var opponent_side: String = "corp"  # or "runner"

# Game phases and turns
enum GamePhase {SETUP, START_TURN, ACTION, DISCARD, END_TURN, GAME_OVER}
var current_phase: int = GamePhase.SETUP
var clicks_remaining: int = 0
var max_clicks: int = 4
var turn_number: int = 0
var active_player: String = player_side

# Win conditions
var runner_agenda_points: int = 0
var corp_agenda_points: int = 0
var agenda_points_to_win: int = 7
var runner_cards_remaining: int = 0
var corp_cards_remaining: int = 0
var game_over: bool = false
var win_message: String = ""

# Node references
@onready var game_state_info = $VSplitContainer/GameArea/GameStatePanel/MarginContainer/GameStateInfo
@onready var hand_cards_list = $VSplitContainer/GameArea/HSplitContainer/GameZones/HandArea/MarginContainer/HandCardsList
@onready var played_cards_list = $VSplitContainer/GameArea/HSplitContainer/GameZones/PlayedCardsArea/MarginContainer/PlayedCardsList
@onready var card_details_text = $VSplitContainer/CardDetailsPanel/MarginContainer/VBoxContainer/CardDetailsRichText
@onready var draw_card_button = $VSplitContainer/GameArea/HSplitContainer/ActionPanel/MarginContainer/VBoxContainer/DrawCardButton
@onready var play_card_button = $VSplitContainer/GameArea/HSplitContainer/ActionPanel/MarginContainer/VBoxContainer/PlayCardButton
@onready var discard_card_button = $VSplitContainer/GameArea/HSplitContainer/ActionPanel/MarginContainer/VBoxContainer/DiscardCardButton
@onready var end_turn_button = $VSplitContainer/GameArea/HSplitContainer/ActionPanel/MarginContainer/VBoxContainer/EndTurnButton
@onready var phase_label = $VSplitContainer/GameArea/GameStatePanel/MarginContainer/PhaseLabel

# Card data arrays
var hand_cards: Array = []
var played_cards: Array = []

func _ready():
    # Initialize deck manager
    deck_manager = DeckManager.new()
    if deck_manager.card_definitions.is_empty():
        deck_manager.create_default_definitions()
    
    # Set up appropriate deck for the player
    if player_side == "runner":
        deck_manager.create_default_runner_deck()
    else:
        deck_manager.create_default_corp_deck()
    
    # Connect signals
    hand_cards_list.item_selected.connect(_on_hand_card_selected)
    draw_card_button.pressed.connect(_on_draw_card_pressed)
    play_card_button.pressed.connect(_on_play_card_pressed)
    discard_card_button.pressed.connect(_on_discard_card_pressed)
    end_turn_button.pressed.connect(_on_end_turn_pressed)
    
    # Start the game
    start_game()

func start_game():
    # Reset game state
    runner_agenda_points = 0
    corp_agenda_points = 0
    turn_number = 0
    
    # Initial setup
    active_player = player_side
    current_phase = GamePhase.SETUP
    
    # Initial draw
    for i in range(5):
        draw_card()
    
    # Track cards remaining
    runner_cards_remaining = deck_manager.runner_deck.size()
    corp_cards_remaining = deck_manager.corp_deck.size()
    
    # Begin first turn
    start_turn()

func update_game_state_display():
    # Update phase display
    var phase_text = ""
    match current_phase:
        GamePhase.SETUP: phase_text = "SETUP PHASE"
        GamePhase.START_TURN: phase_text = "START OF TURN"
        GamePhase.ACTION: phase_text = "ACTION PHASE - Clicks: " + str(clicks_remaining)
        GamePhase.DISCARD: phase_text = "DISCARD PHASE"
        GamePhase.END_TURN: phase_text = "END OF TURN"
        GamePhase.GAME_OVER: phase_text = "GAME OVER - " + win_message
    
    # Update phase_label
    phase_label.text = phase_text
    
    # Get cards in deck
    var cards_in_deck = deck_manager.runner_deck.size() if player_side == "runner" else deck_manager.corp_deck.size()
    
    # Update game state display
    var agenda_display = "Agenda Points - Runner: %d/%d, Corp: %d/%d" % [
        runner_agenda_points, 
        agenda_points_to_win, 
        corp_agenda_points, 
        agenda_points_to_win
    ]
    
    game_state_info.text = "%s | Turn: %d | %s Credits: %d | Memory: %d/%d | Hand: %d | Deck: %d | %s" % [
        active_player.capitalize(),
        turn_number,
        player_side.capitalize(),
        player_credits,
        memory_units_used,
        memory_units_available,
        hand_cards.size(),
        cards_in_deck,
        agenda_display
    ]
    
    # Update button states based on current phase and actions available
    draw_card_button.disabled = clicks_remaining <= 0 or current_phase != GamePhase.ACTION
    play_card_button.disabled = selected_hand_card_index < 0 or clicks_remaining < 1 or current_phase != GamePhase.ACTION
    discard_card_button.disabled = selected_hand_card_index < 0 or (current_phase != GamePhase.ACTION and current_phase != GamePhase.DISCARD)
    end_turn_button.disabled = (current_phase != GamePhase.ACTION and current_phase != GamePhase.DISCARD) or hand_cards.size() > 5

func start_turn():
    turn_number += 1
    current_phase = GamePhase.START_TURN
    
    # Reset clicks
    clicks_remaining = max_clicks
    
    # Gain credits at the start of turn
    player_credits += 1
    
    # Update UI
    update_game_state_display()
    card_details_text.text = "[center][b]Turn %d Started![/b][/center]\nYou gained 1 credit." % turn_number
    
    # Move to action phase
    await get_tree().create_timer(0.5).timeout
    current_phase = GamePhase.ACTION
    update_game_state_display()

func draw_card():
    # Check if action is allowed
    if current_phase == GamePhase.ACTION and clicks_remaining <= 0:
        card_details_text.text = "[color=red]Not enough clicks remaining![/color]"
        return false
    
    var card_data = deck_manager.draw_card(player_side)
    if card_data:
        hand_cards.append(card_data)
        _update_hand_display()
        
        # Spend a click if in action phase
        if current_phase == GamePhase.ACTION:
            clicks_remaining -= 1
        
        # Check deck depletion win condition
        check_deck_depletion()
        
        update_game_state_display()
        return true
    else:
        card_details_text.text = "[color=red]No more cards in deck![/color]"
        return false

func _update_hand_display():
    hand_cards_list.clear()
    
    for card in hand_cards:
        var card_name = card.name
        var card_cost = card.cost
        var card_type = card.card_type
        
        # Display cards with costs and types
        hand_cards_list.add_item("[%d] %s - %s" % [card_cost, card_name, card_type])

func _update_played_cards_display():
    played_cards_list.clear()
    
    if played_cards.is_empty():
        played_cards_list.add_item("[No cards installed]")
    else:
        for card in played_cards:
            var card_name = card.name
            var card_type = card.card_type
            
            # Additional info for specific card types
            var extra_info = ""
            if card_type.to_lower() in ["icebreaker", "program", "ice"]:
                extra_info = " (STR: %d)" % card.strength
            
            played_cards_list.add_item("%s - %s%s" % [card_name, card_type, extra_info])

func _on_hand_card_selected(index):
    selected_hand_card_index = index
    if index >= 0 and index < hand_cards.size():
        _display_card_details(hand_cards[index])
    update_game_state_display()

func _display_card_details(card):
    var text = "[center][b]%s[/b][/center]\n" % card.name
    text += "[b]Type:[/b] %s\n" % card.card_type
    text += "[b]Cost:[/b] %d credits\n" % card.cost
    
    if card.card_type.to_lower() in ["icebreaker", "program", "ice"]:
        text += "[b]Strength:[/b] %d\n" % card.strength
    
    if card.card_type.to_lower() in ["icebreaker", "program"]:
        text += "[b]Memory:[/b] %d MU\n" % card.memory_units
    
    if card.card_type.to_lower() == "agenda":
        text += "[b]Agenda Points:[/b] %d\n" % card.agenda_points
    
    text += "\n[b]Card Text:[/b]\n%s" % card.text
    
    card_details_text.text = text

func _on_draw_card_pressed():
    if current_phase == GamePhase.ACTION and clicks_remaining > 0:
        draw_card()
    else:
        card_details_text.text = "[color=red]Cannot draw card in current phase or no clicks remaining![/color]"

func _on_play_card_pressed():
    if current_phase == GamePhase.ACTION and clicks_remaining > 0:
        if selected_hand_card_index >= 0 and selected_hand_card_index < hand_cards.size():
            var card = hand_cards[selected_hand_card_index]
            
            # Check if player has enough credits to play the card
            if player_credits < card.cost:
                card_details_text.text = "[color=red]Not enough credits to play this card![/color]"
                return
            
            # Check memory requirements for programs
            if card.card_type.to_lower() in ["program", "icebreaker"]:
                if memory_units_used + card.memory_units > memory_units_available:
                    card_details_text.text = "[color=red]Not enough memory units available![/color]"
                    return
                # Add memory usage
                memory_units_used += card.memory_units
            
            # Handle agenda cards
            if card.card_type.to_lower() == "agenda":
                if player_side == "corp":
                    # Corp can install agendas
                    pass
                else:
                    # Runner steals agendas
                    if player_side == "runner":
                        runner_agenda_points += card.agenda_points
                    else:
                        corp_agenda_points += card.agenda_points
                    
                    # Check win condition
                    check_agenda_win_condition()
            
            # Deduct credits
            player_credits -= card.cost
            
            # Spend a click
            clicks_remaining -= 1
            
            # Move card from hand to play area
            played_cards.append(card)
            hand_cards.remove_at(selected_hand_card_index)
            
            # Reset selection
            selected_hand_card_index = -1
            
            # Update UI
            _update_hand_display()
            _update_played_cards_display()
            update_game_state_display()
            card_details_text.text = "[center][b]Card played successfully![/b][/center]"
    else:
        card_details_text.text = "[color=red]Cannot play card in current phase or no clicks remaining![/color]"

func _on_discard_card_pressed():
    if current_phase == GamePhase.ACTION or current_phase == GamePhase.DISCARD:
        if selected_hand_card_index >= 0 and selected_hand_card_index < hand_cards.size():
            # Get the card
            var card = hand_cards[selected_hand_card_index]
            
            # If in action phase, spend a click
            if current_phase == GamePhase.ACTION:
                clicks_remaining -= 1
            
            # Move to discard pile
            if player_side == "runner":
                deck_manager.runner_discard.append(card)
            else:
                deck_manager.corp_discard.append(card)
            
            # Remove from hand
            hand_cards.remove_at(selected_hand_card_index)
            
            # Reset selection
            selected_hand_card_index = -1
            
            # Update UI
            _update_hand_display()
            update_game_state_display()
            card_details_text.text = "[center][b]Card discarded![/b][/center]"
            
            # If in discard phase and hand size <= 5, can end turn
            if current_phase == GamePhase.DISCARD and hand_cards.size() <= 5:
                end_turn()
    else:
        card_details_text.text = "[color=red]Cannot discard card in current phase![/color]"

func _on_end_turn_pressed():
    if current_phase == GamePhase.ACTION:
        if hand_cards.size() > 5:
            # Must discard down to 5 cards
            current_phase = GamePhase.DISCARD
            update_game_state_display()
            card_details_text.text = "[color=orange]Discard down to 5 cards to end your turn.[/color]"
        else:
            end_turn()
    elif current_phase == GamePhase.DISCARD and hand_cards.size() <= 5:
        end_turn()
    else:
        card_details_text.text = "[color=red]Cannot end turn in current phase![/color]"

func end_turn():
    current_phase = GamePhase.END_TURN
    update_game_state_display()
    
    # Perform end of turn effects here
    card_details_text.text = "[center][b]Turn ended.[/b][/center]"
    
    # Brief pause before next turn
    await get_tree().create_timer(1.0).timeout
    
    # Start next turn
    if not game_over:
        start_turn()

func check_agenda_win_condition():
    if runner_agenda_points >= agenda_points_to_win:
        game_over = true
        current_phase = GamePhase.GAME_OVER
        win_message = "Runner Wins by Agenda Points!"
        card_details_text.text = "[center][b]%s[/b][/center]\nPress 'End Turn' to return to menu." % win_message
        update_game_state_display()
    elif corp_agenda_points >= agenda_points_to_win:
        game_over = true
        current_phase = GamePhase.GAME_OVER
        win_message = "Corporation Wins by Agenda Points!"
        card_details_text.text = "[center][b]%s[/b][/center]\nPress 'End Turn' to return to menu." % win_message
        update_game_state_display()

func check_deck_depletion():
    runner_cards_remaining = deck_manager.runner_deck.size()
    corp_cards_remaining = deck_manager.corp_deck.size()
    
    # Runner wins if Corp deck is empty
    if corp_cards_remaining <= 0 and player_side == "runner":
        game_over = true
        current_phase = GamePhase.GAME_OVER
        win_message = "Runner Wins by Corp Deck Depletion!"
        card_details_text.text = "[center][b]%s[/b][/center]\nPress 'End Turn' to return to menu." % win_message
        update_game_state_display()
    
    # Corp wins if Runner is forced to draw but can't
    if runner_cards_remaining <= 0 and player_side == "runner" and current_phase != GamePhase.SETUP:
        game_over = true
        current_phase = GamePhase.GAME_OVER
        win_message = "Corporation Wins by Runner Deck Depletion!"
        card_details_text.text = "[center][b]%s[/b][/center]\nPress 'End Turn' to return to menu." % win_message
        update_game_state_display()
