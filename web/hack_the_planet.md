# Neon Dominance Web Version - Development Roadmap

## Completed ✅
* [x] Reintroduce the threejs spinning cube on the main page
* [x] Add hidden d20 easter egg (replaced teapot)
* [x] Make main menu screen semi-transparent so background cube can be seen
* [x] Implement Docker deployment

## In Progress 🚀
* [ ] Getting deployed somewhere we can playtest it
* [ ] Iterate on gameplay mechanics

## Up Next 🔜
* [ ] Handle deprecation warnings

## Future Improvements 📝
* [ ] Optimize webpack bundle size (code splitting, lazy loading)
* [ ] More iteration on demo mode
* [ ] Set up a droplet to run this and share it
* [ ] Add the mp3s and play them in the menu somehow

## Docker Deployment Instructions
```bash
# Production build
docker-compose up app

# Development with hot-reloading
docker-compose up dev
```