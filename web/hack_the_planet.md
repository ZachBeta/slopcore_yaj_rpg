# Neon Dominance Web Version - Development Roadmap

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