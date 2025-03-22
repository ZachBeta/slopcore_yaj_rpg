extends TestBase

# Integration tests for Runner and Corporation interactions
# Tests the asymmetric gameplay mechanics

# Mock classes for testing
class MockRunner:
	var credits = 5
	var deck = []
	var hand = []
	var installed_programs = []
	var neural_damage = 0
	var successful_runs = 0
	
	func draw_card():
		if deck.size() > 0:
			var card = deck.pop_front()
			hand.append(card)
			return card
		return null
	
	func install_program(program):
		if program.card_type == "Program" and credits >= program.cost:
			credits -= program.cost
			installed_programs.append(program)
			hand.erase(program)
			return true
		return false
	
	# Complete rewrite of the make_run function to fix logic issues
	func make_run(server, installed_programs):
		print("  DEBUG: Starting run against server with " + str(server.ice.size()) + " ice")
		
		# Check each piece of ice on the server
		for ice in server.ice:
			print("  DEBUG: Encountering ice: " + ice.name + " with strength " + str(ice.strength))
			
			# Default assumption - we can't break this ice
			var can_break = false
			
			# Check each program to see if any can break this ice
			for program in installed_programs:
				print("  DEBUG: Checking program with strength " + str(program.strength))
				if program.strength >= ice.strength:
					can_break = true
					print("  DEBUG: Program can break ice")
					break
			
			# If we can't break this ice, run fails and we take damage
			if not can_break:
				print("  DEBUG: Cannot break ice, run fails")
				neural_damage += 1
				return false
		
		# If we get past all ice or there's no ice, the run is successful
		print("  DEBUG: Run successful")
		successful_runs += 1
		return true

class MockCorporation:
	var credits = 5
	var servers = {}
	var ice_cards = []
	var agenda_cards = []
	
	func create_server(name):
		servers[name] = {
			"ice": [],
			"content": []
		}
	
	func install_ice(server_name, ice):
		if servers.has(server_name) and credits >= ice.rez_cost:
			servers[server_name].ice.append(ice)
			ice_cards.erase(ice)
			return true
		return false
	
	func install_agenda(server_name, agenda):
		if servers.has(server_name):
			servers[server_name].content.append(agenda)
			agenda_cards.erase(agenda)
			return true
		return false

class MockCard:
	var card_name
	var card_type
	var cost
	var strength
	
	func _init(p_name, p_type, p_cost, p_strength):
		card_name = p_name
		card_type = p_type
		cost = p_cost
		strength = p_strength

class MockIce:
	var name
	var strength
	var rez_cost
	
	func _init(p_name, p_strength, p_rez_cost):
		name = p_name
		strength = p_strength
		rez_cost = p_rez_cost

class MockAgenda:
	var name
	var advancement_cost
	var agenda_points
	var advanced = 0
	
	func _init(p_name, p_cost, p_points):
		name = p_name
		advancement_cost = p_cost
		agenda_points = p_points

# Test variables
var runner: MockRunner
var corp: MockCorporation

func setup():
	# Initialize the tests
	runner = MockRunner.new()
	corp = MockCorporation.new()
	
	# Setup Runner deck
	runner.deck = [
		MockCard.new("Sure Gamble", "Event", 5, 0),
		MockCard.new("Easy Mark", "Event", 2, 0),
		MockCard.new("Corroder", "Program", 2, 2),
		MockCard.new("Gordian Blade", "Program", 4, 2)
	]
	
	# Setup Corporation
	corp.create_server("R&D")
	corp.create_server("HQ")
	corp.create_server("Archives")
	corp.create_server("Remote1")
	
	corp.ice_cards = [
		MockIce.new("Ice Wall", 1, 1),
		MockIce.new("Enigma", 2, 3)
	]
	
	corp.agenda_cards = [
		MockAgenda.new("Priority Requisition", 3, 2),
		MockAgenda.new("Project Vitruvius", 3, 2)
	]

func teardown():
	# Clean up after tests
	runner = null
	corp = null

func test_runner_draw_card():
	var initial_hand_size = runner.hand.size()
	runner.draw_card()
	assert_equal(initial_hand_size + 1, runner.hand.size(), "Hand size should increase by 1")
	assert_equal(runner.deck.size(), 3, "Deck size should decrease by 1")

func test_corporation_install_ice():
	var server_name = "HQ"
	var ice = corp.ice_cards[0]
	var initial_credits = corp.credits
	
	var result = corp.install_ice(server_name, ice)
	
	assert_true(result, "Ice installation should succeed")
	assert_equal(1, corp.servers[server_name].ice.size(), "Server should have 1 ice")
	assert_equal(1, corp.ice_cards.size(), "Corp should have 1 ice card left")

func test_runner_vs_corporation_run():
	# Setup for run test
	var server_name = "Remote1"
	var ice = corp.ice_cards[0]  # Ice Wall, strength 1
	corp.install_ice(server_name, ice)
	
	# Runner installs a program
	var program = runner.deck[2]  # Corroder, strength 2
	runner.draw_card()
	runner.draw_card()
	runner.draw_card()
	var install_result = runner.install_program(program)
	
	assert_true(install_result, "Program installation should succeed")
	
	# Runner makes a run
	var run_result = runner.make_run(corp.servers[server_name], runner.installed_programs)
	
	assert_true(run_result, "Run should be successful with a strong enough breaker")
	assert_equal(1, runner.successful_runs, "Runner should have 1 successful run")
	assert_equal(0, runner.neural_damage, "Runner should have no neural damage")
	
	# Try a run without the right breaker
	if corp.ice_cards.size() > 0:
		ice = corp.ice_cards[0]  # Enigma, strength 2
		corp.install_ice("HQ", ice)
		
		# Runner has Corroder with strength 2, which can break Enigma
		run_result = runner.make_run(corp.servers["HQ"], runner.installed_programs)
		assert_true(run_result, "Run should be successful with equal strength breaker")
	else:
		# Add a fallback if no ice cards left
		var medium_ice = MockIce.new("Enigma", 2, 3)
		corp.ice_cards.append(medium_ice)
		corp.install_ice("HQ", medium_ice)
		
		run_result = runner.make_run(corp.servers["HQ"], runner.installed_programs)
		assert_true(run_result, "Run should be successful with equal strength breaker")
	
	test_strong_ice_run()

# New function to test the strong ICE scenario separately
func test_strong_ice_run():
	# Create a new server and strong ICE for a clean test
	corp.create_server("TestServer")
	var strong_ice = MockIce.new("Tollbooth", 5, 8)
	
	# Make sure the runner's neural damage is reset
	runner.neural_damage = 0
	
	# Install the strong ICE on the test server
	corp.credits = 10  # Ensure enough credits
	var install_result = corp.install_ice("TestServer", strong_ice)
	assert_true(install_result, "Strong ICE installation should succeed")
	
	# Verify the ICE was installed
	assert_equal(1, corp.servers["TestServer"].ice.size(), "Test server should have 1 ice")
	
	# Runner attempts run against strong ICE
	var run_result = runner.make_run(corp.servers["TestServer"], runner.installed_programs)
	
	# These assertions should now pass correctly
	assert_false(run_result, "Run should fail against stronger ICE")
	assert_equal(1, runner.neural_damage, "Runner should take neural damage")
