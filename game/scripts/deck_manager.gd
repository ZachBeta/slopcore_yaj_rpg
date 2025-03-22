extends Node
class_name DeckManager

# Decks for both players
var runner_deck: Array[Card] = []
var corp_deck: Array[Card] = []

# Discard piles
var runner_discard: Array[Card] = []
var corp_discard: Array[Card] = []

# Default deck sizes
const DEFAULT_RUNNER_DECK_SIZE = 40
const DEFAULT_CORP_DECK_SIZE = 45

# Random seed for deterministic tests
var random_seed: int = 0

# Reference to card definitions
var card_definitions: Dictionary = {}

func _init() -> void:
	# Load card definitions from JSON files when initialized
	load_card_definitions()

# Set a random seed for deterministic testing
func set_random_seed(seed_value: int) -> void:
	random_seed = seed_value
	print("Deck Manager: Random seed set to " + str(seed_value))

# Load all card definitions from JSON files
func load_card_definitions() -> void:
	var directory = DirAccess.open("res://data/cards")
	if directory:
		directory.list_dir_begin()
		var file_name = directory.get_next()
		
		while file_name != "":
			if file_name.ends_with(".json"):
				var file_path = "res://data/cards/" + file_name
				var json_text = FileAccess.get_file_as_string(file_path)
				var json = JSON.new()
				var parse_result = json.parse(json_text)
				
				if parse_result == OK:
					var card_data = json.get_data()
					if card_data is Dictionary and card_data.has("cards"):
						for card in card_data["cards"]:
							if card.has("id"):
								card_definitions[card["id"]] = card
				
			file_name = directory.get_next()
	else:
		# Create default definitions if directory doesn't exist yet
		create_default_definitions()

# Create some default card definitions for testing
func create_default_definitions() -> void:
	# Create a directory for card definitions if it doesn't exist
	var dir = DirAccess.open("res://")
	if not dir.dir_exists("data"):
		dir.make_dir("data")
	if not dir.dir_exists("data/cards"):
		dir.make_dir_recursive("data/cards")
	
	# Runner cards
	var runner_cards = {
		"cards": [
			{
				"id": "r01",
				"name": "Basic Icebreaker",
				"type": "Icebreaker",
				"subtype": "AI",
				"faction": "Runner",
				"text": "2[credit]: Break ice subroutine.",
				"cost": 3,
				"strength": 2,
				"memory_units": 1
			},
			{
				"id": "r02",
				"name": "Virus Implant",
				"type": "Virus",
				"faction": "Runner",
				"text": "When installed, place 3 virus counters on this card.\nHosted virus counter: Deal 1 neural damage.",
				"cost": 2,
				"memory_units": 1
			},
			{
				"id": "r03",
				"name": "Hardened Access Point",
				"type": "Hardware",
				"faction": "Runner",
				"text": "+2 hand size.",
				"cost": 3
			},
			{
				"id": "r04",
				"name": "Data Mining",
				"type": "Resource",
				"faction": "Runner",
				"text": "Gain 1[credit] whenever you make a successful run.",
				"cost": 2
			},
			{
				"id": "r05",
				"name": "Root Access",
				"type": "Event",
				"faction": "Runner",
				"text": "Make a run. If successful, gain 4[credit].",
				"cost": 1
			}
		]
	}
	
	# Corporation cards
	var corp_cards = {
		"cards": [
			{
				"id": "c01",
				"name": "Firewall",
				"type": "ICE",
				"subtype": "Barrier",
				"faction": "Corporation",
				"text": "[Subroutine] End the run.",
				"cost": 4,
				"strength": 3
			},
			{
				"id": "c02",
				"name": "Neural Tracker",
				"type": "ICE",
				"subtype": "Sentry",
				"faction": "Corporation",
				"text": "[Subroutine] Deal 1 neural damage.\n[Subroutine] End the run.",
				"cost": 5,
				"strength": 4
			},
			{
				"id": "c03",
				"name": "Corporate Server",
				"type": "Asset",
				"faction": "Corporation",
				"text": "Gain 2[credit] at the start of your turn.",
				"cost": 3,
				"trash_cost": 4
			},
			{
				"id": "c04",
				"name": "Hostile Takeover",
				"type": "Agenda",
				"faction": "Corporation",
				"text": "When you score this agenda, gain 5[credit].",
				"advancement_requirement": 2,
				"agenda_points": 1
			},
			{
				"id": "c05",
				"name": "Operation Cleanup",
				"type": "Operation",
				"faction": "Corporation",
				"text": "Purge all virus counters and gain 2[credit].",
				"cost": 1
			}
		]
	}
	
	# Save the card definitions to JSON files
	_save_card_definitions("res://data/cards/runner_cards.json", runner_cards)
	_save_card_definitions("res://data/cards/corp_cards.json", corp_cards)
	
	# Load the definitions into memory
	for card in runner_cards["cards"]:
		card_definitions[card["id"]] = card
	
	for card in corp_cards["cards"]:
		card_definitions[card["id"]] = card

# Save card definitions to a JSON file
func _save_card_definitions(file_path: String, card_data: Dictionary) -> void:
	var json_string = JSON.stringify(card_data, "\t")
	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if file:
		file.store_string(json_string)

# Create a card instance from a card ID
func create_card(card_id: String) -> Card:
	if card_definitions.has(card_id):
		return Card.new(card_definitions[card_id])
	return null

# Create a default runner deck for testing
func create_default_runner_deck() -> void:
	runner_deck.clear()
	
	# Add multiple copies of runner cards
	for i in range(10):
		runner_deck.append(create_card("r01"))  # Basic Icebreaker
	
	for i in range(8):
		runner_deck.append(create_card("r02"))  # Virus Implant
	
	for i in range(6):
		runner_deck.append(create_card("r03"))  # Hardened Access Point
	
	for i in range(10):
		runner_deck.append(create_card("r04"))  # Data Mining
	
	for i in range(6):
		runner_deck.append(create_card("r05"))  # Root Access
	
	# Set owner
	for card in runner_deck:
		card.owner_id = "runner"
	
	# Shuffle the deck
	shuffle_deck(runner_deck)

# Create a default corporation deck for testing
func create_default_corp_deck() -> void:
	corp_deck.clear()
	
	# Add multiple copies of corporation cards
	for i in range(8):
		corp_deck.append(create_card("c01"))  # Firewall
	
	for i in range(8):
		corp_deck.append(create_card("c02"))  # Neural Tracker
	
	for i in range(10):
		corp_deck.append(create_card("c03"))  # Corporate Server
	
	for i in range(9):
		corp_deck.append(create_card("c04"))  # Hostile Takeover
	
	for i in range(10):
		corp_deck.append(create_card("c05"))  # Operation Cleanup
	
	# Set owner
	for card in corp_deck:
		card.owner_id = "corporation"
	
	# Shuffle the deck
	shuffle_deck(corp_deck)

# Shuffle a deck of cards
func shuffle_deck(deck: Array[Card]) -> void:
	var shuffled_deck: Array[Card] = []
	var temp_deck = deck.duplicate()
	
	# Create a seeded random number generator
	var rng = RandomNumberGenerator.new()
	if random_seed != 0:
		rng.seed = random_seed
	else:
		rng.randomize()
	
	while not temp_deck.is_empty():
		var random_index = rng.randi_range(0, temp_deck.size() - 1)
		shuffled_deck.append(temp_deck[random_index])
		temp_deck.remove_at(random_index)
		
		# Increment seed slightly for next number to ensure variety
		# while still maintaining deterministic sequence
		if random_seed != 0:
			random_seed += 1
	
	deck.clear()
	deck.append_array(shuffled_deck)

# Draw a card from the appropriate deck
func draw_card(player: String) -> Card:
	if player == "runner":
		if runner_deck.is_empty():
			return null
		var card = runner_deck.pop_back()
		return card
	else:  # corporation
		if corp_deck.is_empty():
			return null
		var card = corp_deck.pop_back()
		return card

# Draw multiple cards
func draw_cards(player: String, count: int) -> Array[Card]:
	var drawn_cards: Array[Card] = []
	for i in range(count):
		var card = draw_card(player)
		if card:
			drawn_cards.append(card)
		else:
			break
	return drawn_cards

# Discard a card to the appropriate discard pile
func discard_card(card: Card) -> void:
	if card.owner_id == "runner":
		runner_discard.append(card)
	else:  # corporation
		corp_discard.append(card)

# Get deck size
func get_deck_size(player: String) -> int:
	if player == "runner":
		return runner_deck.size()
	else:  # corporation
		return corp_deck.size()

# Get discard pile size
func get_discard_size(player: String) -> int:
	if player == "runner":
		return runner_discard.size()
	else:  # corporation
		return corp_discard.size()

# Shuffle discard pile back into deck (when deck runs out)
func shuffle_discard_into_deck(player: String) -> void:
	if player == "runner":
		runner_deck.append_array(runner_discard)
		runner_discard.clear()
		shuffle_deck(runner_deck)
	else:  # corporation
		corp_deck.append_array(corp_discard)
		corp_discard.clear()
		shuffle_deck(corp_deck)
