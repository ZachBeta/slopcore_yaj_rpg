extends TestBase

# Performance tests for the card system
# Tests various operations under load to ensure good performance

var cards = []
var deck = []
var hand = []

func setup():
	# Create a large number of cards for performance testing
	for i in range(1000):
		var card_type = "Program" if i % 3 == 0 else "Event" if i % 3 == 1 else "Resource"
		var cost = i % 5 + 1
		var strength = i % 3 + 1 if card_type == "Program" else 0
		
		cards.append({
			"id": i,
			"name": "Card " + str(i),
			"type": card_type,
			"cost": cost,
			"strength": strength
		})

func teardown():
	cards.clear()
	deck.clear()
	hand.clear()

func test_deck_shuffle_performance():
	# Test performance of shuffling a large deck
	deck = cards.duplicate()
	
	var start_time = Time.get_ticks_msec()
	
	# Perform Fisher-Yates shuffle
	var n = deck.size()
	for i in range(n - 1, 0, -1):
		var j = randi() % (i + 1)
		var temp = deck[i]
		deck[i] = deck[j]
		deck[j] = temp
	
	var end_time = Time.get_ticks_msec()
	var elapsed = end_time - start_time
	
	print("  Shuffle time for %d cards: %d ms" % [deck.size(), elapsed])
	assert_true(elapsed < 100, "Deck shuffle should be fast (< 100ms)")

func test_card_search_performance():
	# Test performance of searching for cards by properties
	deck = cards.duplicate()
	
	var start_time = Time.get_ticks_msec()
	
	# Search for all program cards with cost <= 3
	var results = []
	for card in deck:
		if card.type == "Program" and card.cost <= 3:
			results.append(card)
	
	var end_time = Time.get_ticks_msec()
	var elapsed = end_time - start_time
	
	print("  Search time for cards in deck of %d: %d ms" % [deck.size(), elapsed])
	print("  Found %d matching cards" % results.size())
	assert_true(elapsed < 50, "Card search should be fast (< 50ms)")

func test_hand_draw_performance():
	# Test performance of drawing multiple cards
	deck = cards.duplicate()
	hand = []
	
	var start_time = Time.get_ticks_msec()
	
	# Draw 50 cards
	for i in range(50):
		if deck.size() > 0:
			hand.append(deck.pop_front())
	
	var end_time = Time.get_ticks_msec()
	var elapsed = end_time - start_time
	
	print("  Time to draw 50 cards: %d ms" % elapsed)
	assert_true(elapsed < 20, "Drawing cards should be fast (< 20ms)")

func test_card_sorting_performance():
	# Test performance of sorting cards by multiple criteria
	hand = cards.slice(0, 100) # Use first 100 cards
	
	var start_time = Time.get_ticks_msec()
	
	# Sort cards by type, then by cost
	hand.sort_custom(Callable(self, "card_sorter"))
	
	var end_time = Time.get_ticks_msec()
	var elapsed = end_time - start_time
	
	print("  Time to sort 100 cards: %d ms" % elapsed)
	assert_true(elapsed < 30, "Card sorting should be fast (< 30ms)")

# Custom sort function for cards
func card_sorter(a, b):
	# First sort by type
	if a.type != b.type:
		return a.type < b.type
	
	# Then by cost
	if a.cost != b.cost:
		return a.cost < b.cost
	
	# Finally by name
	return a.name < b.name
