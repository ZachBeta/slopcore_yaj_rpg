extends TestBase

var deck_manager
var card_instance

func setup():
	deck_manager = load("res://scripts/deck_manager.gd").new()
	deck_manager.create_default_definitions()

func teardown():
	deck_manager = null
	card_instance = null

func test_card_creation():
	card_instance = deck_manager.create_card("r01")  # Basic Icebreaker
	
	assert_not_null(card_instance, "Card should be created successfully")
	assert_equal(card_instance.name, "Basic Icebreaker", "Card name should match")
	assert_equal(card_instance.card_type, "Icebreaker", "Card type should match")
	assert_equal(3, card_instance.cost, "Card cost should be 3")
	assert_equal(2, card_instance.strength, "Card strength should be 2")
	assert_equal(1, card_instance.memory_units, "Card memory units should be 1")

func test_card_color():
	# Test different card type colors
	var icebreaker = deck_manager.create_card("r01")
	var virus = deck_manager.create_card("r02")
	var hardware = deck_manager.create_card("r03")
	var resource = deck_manager.create_card("r04")
	var ice = deck_manager.create_card("c01")
	
	assert_not_equal(icebreaker.color, virus.color, "Icebreaker and Virus should have different colors")
	assert_not_equal(hardware.color, resource.color, "Hardware and Resource should have different colors")
	assert_not_equal(icebreaker.color, ice.color, "Runner and Corporation cards should have different colors")

func test_deck_creation():
	deck_manager.create_default_runner_deck()
	deck_manager.create_default_corp_deck()
	
	assert_equal(40, deck_manager.get_deck_size("runner"), "Runner deck should have 40 cards")
	assert_equal(45, deck_manager.get_deck_size("corporation"), "Corporation deck should have 45 cards")

func test_card_drawing():
	deck_manager.create_default_runner_deck()
	var initial_size = deck_manager.get_deck_size("runner")
	
	var drawn_card = deck_manager.draw_card("runner")
	
	assert_not_null(drawn_card, "Should successfully draw a card")
	assert_equal(initial_size - 1, deck_manager.get_deck_size("runner"), "Deck size should decrease by 1")
	
	# Test drawing multiple cards
	var drawn_cards = deck_manager.draw_cards("runner", 5)
	
	assert_equal(5, drawn_cards.size(), "Should draw 5 cards")
	assert_equal(initial_size - 6, deck_manager.get_deck_size("runner"), "Deck size should decrease by 6 total")

func test_discard_pile():
	deck_manager.create_default_runner_deck()
	var drawn_card = deck_manager.draw_card("runner")
	
	assert_equal(0, deck_manager.get_discard_size("runner"), "Discard pile should start empty")
	
	deck_manager.discard_card(drawn_card)
	
	assert_equal(1, deck_manager.get_discard_size("runner"), "Discard pile should have 1 card")
	
	# Test shuffling discard back into deck
	deck_manager.shuffle_discard_into_deck("runner")
	
	assert_equal(0, deck_manager.get_discard_size("runner"), "Discard pile should be empty after shuffling")
	assert_equal(40, deck_manager.get_deck_size("runner"), "Deck should contain all cards again")

func test_card_counters():
	card_instance = deck_manager.create_card("r02")  # Virus Implant
	
	assert_equal(0, card_instance.counters.size(), "Card should start with no counters")
	
	card_instance.add_counter("virus", 3)
	
	assert_true(card_instance.counters.has("virus"), "Card should have virus counters")
	assert_equal(3, card_instance.counters["virus"], "Card should have 3 virus counters")
	
	var removed = card_instance.remove_counter("virus", 2)
	
	assert_true(removed, "Counter removal should succeed")
	assert_equal(1, card_instance.counters["virus"], "Card should have 1 virus counter remaining")
	
	removed = card_instance.remove_counter("virus", 2)
	
	assert_false(removed, "Counter removal should fail when not enough counters")
	assert_equal(1, card_instance.counters["virus"], "Card should still have 1 virus counter")

func test_card_installation():
	card_instance = deck_manager.create_card("r01")  # Basic Icebreaker
	
	assert_false(card_instance.is_installed, "Card should start uninstalled")
	
	card_instance.on_install()
	
	assert_true(card_instance.is_installed, "Card should be installed after on_install()")

func test_corporation_rez():
	card_instance = deck_manager.create_card("c01")  # Firewall (ICE)
	card_instance.owner_id = "corporation"
	
	assert_false(card_instance.is_rezzed, "Corp card should start unrezzed")
	
	# Not enough credits
	var rez_result = card_instance.on_rez(3)
	
	assert_false(rez_result, "Rez should fail with insufficient credits")
	assert_false(card_instance.is_rezzed, "Card should remain unrezzed")
	
	# Enough credits
	rez_result = card_instance.on_rez(5)
	
	assert_true(rez_result, "Rez should succeed with sufficient credits")
	assert_true(card_instance.is_rezzed, "Card should be rezzed")

func test_card_serialization():
	card_instance = deck_manager.create_card("r01")  # Basic Icebreaker
	card_instance.is_installed = true
	card_instance.add_counter("power", 2)
	
	var card_dict = card_instance.to_dict()
	
	assert_equal("r01", card_dict["id"], "Serialized card should preserve ID")
	assert_equal("Basic Icebreaker", card_dict["name"], "Serialized card should preserve name")
	assert_true(card_dict["is_installed"], "Serialized card should preserve installed state")
	assert_equal(2, card_dict["counters"]["power"], "Serialized card should preserve counters")
