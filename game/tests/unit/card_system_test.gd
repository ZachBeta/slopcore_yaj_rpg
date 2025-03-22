extends TestBase

# Unit tests for our enhanced Card and Deck system

# Card class implementation for testing
class MockCard:
	var id: String = ""
	var name: String = "Unknown Card"
	var card_type: String = ""
	var subtype: String = ""
	var faction: String = ""
	var text: String = ""
	
	var cost: int = 0
	var strength: int = 0
	var memory_units: int = 0
	var trash_cost: int = 0
	var advancement_requirement: int = 0
	var agenda_points: int = 0
	
	var owner_id: String = ""
	var is_installed: bool = false
	var is_rezzed: bool = false
	var hosted_cards = []
	var counters = {}
	
	func _init(card_data: Dictionary = {}):
		if card_data.is_empty():
			return
			
		# Set basic properties
		id = card_data.get("id", "")
		name = card_data.get("name", "Unknown Card")
		card_type = card_data.get("type", "")
		subtype = card_data.get("subtype", "")
		faction = card_data.get("faction", "")
		text = card_data.get("text", "")
		
		# Set costs and stats
		cost = card_data.get("cost", 0)
		strength = card_data.get("strength", 0)
		memory_units = card_data.get("memory_units", 0)
		trash_cost = card_data.get("trash_cost", 0)
		advancement_requirement = card_data.get("advancement_requirement", 0)
		agenda_points = card_data.get("agenda_points", 0)
		
		# Set owner
		owner_id = card_data.get("owner_id", "")
	
	func get_color_for_type(type: String) -> Color:
		match type.to_lower():
			"icebreaker":
				return Color(0.2, 0.4, 0.8, 0.5)  # Blue
			"virus":
				return Color(0.8, 0.2, 0.2, 0.5)  # Red
			"resource":
				return Color(0.2, 0.7, 0.2, 0.5)  # Green
			"hardware":
				return Color(0.7, 0.7, 0.2, 0.5)  # Yellow
			"ice":
				return Color(0.3, 0.3, 0.5, 0.5)  # Purple-gray
			_:
				return Color(0.5, 0.5, 0.5, 0.5)  # Gray (default)
	
	func can_play(player_credits: int) -> bool:
		return player_credits >= cost
	
	func on_install() -> void:
		is_installed = true
	
	func on_rez(player_credits: int) -> bool:
		if player_credits >= cost:
			is_rezzed = true
			return true
		return false
	
	func add_counter(counter_type: String, amount: int = 1) -> void:
		if not counters.has(counter_type):
			counters[counter_type] = 0
		counters[counter_type] += amount
	
	func remove_counter(counter_type: String, amount: int = 1) -> bool:
		if not counters.has(counter_type) or counters[counter_type] < amount:
			return false
		
		counters[counter_type] -= amount
		if counters[counter_type] <= 0:
			counters.erase(counter_type)
		return true
	
	func to_dict() -> Dictionary:
		return {
			"id": id,
			"name": name,
			"type": card_type,
			"subtype": subtype,
			"faction": faction,
			"text": text,
			"cost": cost,
			"strength": strength,
			"memory_units": memory_units,
			"trash_cost": trash_cost,
			"advancement_requirement": advancement_requirement,
			"agenda_points": agenda_points,
			"is_installed": is_installed,
			"is_rezzed": is_rezzed,
			"counters": counters,
			"owner_id": owner_id
		}

# Test variables
var test_card: MockCard

func setup():
	# This runs before each test
	test_card = MockCard.new({
		"id": "r01",
		"name": "Test Icebreaker",
		"type": "Icebreaker",
		"subtype": "AI", 
		"cost": 3,
		"strength": 2,
		"memory_units": 1
	})

func teardown():
	# This runs after each test
	test_card = null

func test_card_creation():
	assert_equal("Test Icebreaker", test_card.name, "Card name should match")
	assert_equal("Icebreaker", test_card.card_type, "Card type should match")
	assert_equal(3, test_card.cost, "Card cost should be 3")
	assert_equal(2, test_card.strength, "Card strength should be 2")
	assert_equal(1, test_card.memory_units, "Card memory units should be 1")

func test_card_color_differences():
	var icebreaker_color = test_card.get_color_for_type("Icebreaker")
	var virus_color = test_card.get_color_for_type("Virus")
	var hardware_color = test_card.get_color_for_type("Hardware")
	var resource_color = test_card.get_color_for_type("Resource")
	var ice_color = test_card.get_color_for_type("ICE")
	
	assert_not_equal(icebreaker_color, virus_color, "Icebreaker and Virus should have different colors")
	assert_not_equal(hardware_color, resource_color, "Hardware and Resource should have different colors")
	assert_not_equal(icebreaker_color, ice_color, "Runner and Corporation cards should have different colors")

func test_card_counters():
	assert_equal(0, test_card.counters.size(), "Card should start with no counters")
	
	test_card.add_counter("virus", 3)
	
	assert_true(test_card.counters.has("virus"), "Card should have virus counters")
	assert_equal(3, test_card.counters["virus"], "Card should have 3 virus counters")
	
	var removed = test_card.remove_counter("virus", 2)
	
	assert_true(removed, "Counter removal should succeed")
	assert_equal(1, test_card.counters["virus"], "Card should have 1 virus counter remaining")
	
	removed = test_card.remove_counter("virus", 2)
	
	assert_false(removed, "Counter removal should fail when not enough counters")
	assert_equal(1, test_card.counters["virus"], "Card should still have 1 virus counter")

func test_card_installation():
	assert_false(test_card.is_installed, "Card should start uninstalled")
	
	test_card.on_install()
	
	assert_true(test_card.is_installed, "Card should be installed after on_install()")

func test_corporation_card_rez():
	var corp_card = MockCard.new({
		"id": "c01",
		"name": "Firewall",
		"type": "ICE",
		"cost": 4
	})
	corp_card.owner_id = "corporation"
	
	assert_false(corp_card.is_rezzed, "Corp card should start unrezzed")
	
	# Not enough credits
	var rez_result = corp_card.on_rez(3)
	
	assert_false(rez_result, "Rez should fail with insufficient credits")
	assert_false(corp_card.is_rezzed, "Card should remain unrezzed")
	
	# Enough credits
	rez_result = corp_card.on_rez(5)
	
	assert_true(rez_result, "Rez should succeed with sufficient credits")
	assert_true(corp_card.is_rezzed, "Card should be rezzed")

func test_card_serialization():
	test_card.is_installed = true
	test_card.add_counter("power", 2)
	
	var card_dict = test_card.to_dict()
	
	assert_equal("r01", card_dict["id"], "Serialized card should preserve ID")
	assert_equal("Test Icebreaker", card_dict["name"], "Serialized card should preserve name")
	assert_true(card_dict["is_installed"], "Serialized card should preserve installed state")
	assert_equal(2, card_dict["counters"]["power"], "Serialized card should preserve counters")

func test_card_play_validation():
	assert_true(test_card.can_play(5), "Card should be playable with sufficient credits")
	assert_true(test_card.can_play(3), "Card should be playable with exact credits")
	assert_false(test_card.can_play(2), "Card should not be playable with insufficient credits")
