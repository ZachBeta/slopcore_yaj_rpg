# Neon Dominance - Web Version

This is the web implementation of Neon Dominance (formerly Slopcore YAJ RPG) using TypeScript and Three.js for rendering.

## Current Version
**v0.7.1** - Improved drone movement controls that respect orientation

## Features

- 3D rendering with Three.js including interactive spinning cube
- Semi-transparent cyberpunk-styled UI
- Hidden d20 easter egg (try to find the HACK button!)
- Browser console-based gameplay
- TypeScript for type safety
- Docker deployment for both production and development
- Orientation-based drone movement for intuitive controls

## Getting Started

### Prerequisites

- Node.js (v14.x or higher recommended)
- npm (v6.x or higher recommended)

### Installation

1. Navigate to the web directory:
   ```
   cd web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

   This will open the application in your default web browser.

### Linting

The project uses Deno's linter for code quality checks. To run the linter:

```
npm run lint
```

To automatically fix linting issues where possible:

```
npm run lint:fix
```

Linting configuration is defined in `deno.json`.

### Building for Production

To create a production build:

```
npm run build
```

The built files will be available in the `dist` directory.

### Docker

#### Running with Docker

The application can be run using Docker, with both production and development environments available.

#### Production

To build and run the production version:

```bash
# Build and start the production container
docker-compose up app

# Or in detached mode
docker-compose up -d app
```

The application will be available at http://localhost:8080

#### Development with Hot-Reloading

For development with hot-reloading:

```bash
# Build and start the development container
docker-compose up dev
```

The development server will be available at http://localhost:8080 with live reloading enabled.

## Project Structure

- `public/` - Static assets and HTML template
- `src/` - TypeScript source code
  - `src/terminal-game/` - Core game logic
  - `src/three-scene.ts` - Three.js rendering
- `dist/` - Production build output (created when building)

## Development Roadmap

See the [hack_the_planet.md](hack_the_planet.md) file for current development status and upcoming features.

## License

See the LICENSE file in the root directory of this project for licensing information. 