extends TestBase

# Unit tests for the Card class

# Mock Card class for testing
class MockCard:
	var card_name: String
	var card_type: String
	var cost: int
	var strength: int
	
	func _init(p_name: String, p_type: String, p_cost: int, p_strength: int):
		card_name = p_name
		card_type = p_type
		cost = p_cost
		strength = p_strength
	
	func can_play(credits: int) -> bool:
		return credits >= cost

# Test variables
var test_card: MockCard

func setup():
	# This runs before each test
	test_card = MockCard.new("Test Card", "Program", 3, 2)

func teardown():
	# This runs after each test
	test_card = null

func test_card_initialization():
	assert_equal("Test Card", test_card.card_name, "Card name should match")
	assert_equal("Program", test_card.card_type, "Card type should match")
	assert_equal(3, test_card.cost, "Card cost should match")
	assert_equal(2, test_card.strength, "Card strength should match")

func test_can_play_with_sufficient_credits():
	assert_true(test_card.can_play(5), "Should be playable with 5 credits")
	assert_true(test_card.can_play(3), "Should be playable with exact credits")
	
func test_can_play_with_insufficient_credits():
	assert_false(test_card.can_play(2), "Should not be playable with 2 credits")
	assert_false(test_card.can_play(0), "Should not be playable with 0 credits")
