# Neon Dominance Web Version - Development Roadmap

## open world game

* dig up favicon - somewhere it got dropped
* typing and linting 
* colors are good, position and rotation are not, I think we tried to extract types to help that
* consistent map
* deno lint over eslint
* we need to keep our test timeouts short
* we avoid mocks, and use real objects as much as possible

* server diagnostics is getting noisy in dev logs
* tests are slow as hell

* convert js to ts
  * extract types out wherever possible

* multiplayer kind of works, players can join, colors still seem wrong
* connection limit is forcing dev code to contain a test check, bad design
* rules.md : prefer assertions over console.log in tests
* shorten timeout in integration test
* player colors are not consistent - red player should be red on both clients, blue player same
* maps are different - let's generate that on server start and find a way to relay that to the player
* generate a random username in the form "adjective noun"
* track player in the browser session

## soon

* [ ] the demo only runs thru part of a player turn, it should get thru to someone winning
* [ ] explore in browser LLM calls https://developer.chrome.com/docs/ai/built-in

## Completed ✅
* [x] Reintroduce the threejs spinning cube on the main page
* [x] Add hidden d20 easter egg (replaced teapot)
* [x] Make main menu screen semi-transparent so background cube can be seen
* [x] Implement Docker deployment
* [x] Implement open world prototype with multiplayer collision interaction
* [x] Add camera rotation controls (IJKL) to open world prototype

## In Progress 🚀
* [ ] Getting deployed somewhere we can playtest it
* [ ] Iterate on gameplay mechanics
* [ ] Enhance open world prototype with real multiplayer using Socket.io

## Up Next 🔜
* [ ] Handle deprecation warnings
* [ ] Improve open world environment with more detailed terrain and objects
* [ ] Add user interface for open world game

## Future Improvements 📝
* [ ] Optimize webpack bundle size (code splitting, lazy loading)
* [ ] More iteration on demo mode
* [ ] Set up a droplet to run this and share it
* [ ] Add the mp3s and play them in the menu somehow
* [ ] Implement chat system for open world game
* [ ] Add more player interactions in open world game

## Docker Deployment Instructions
```bash
# Production build
docker-compose up app

# Development with hot-reloading
docker-compose up dev
```