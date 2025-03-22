# Slopcore YAJ RPG - Web Version

This is the web implementation of Slopcore YAJ RPG using TypeScript and Three.js for rendering.

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
- `dist/` - Production build output (created when building)

## Features

- 3D rendering with Three.js
- TypeScript for type safety
- Modern web development workflow with Webpack

## Development

The project follows the same principles as the main Slopcore YAJ RPG project:

- Following semantic versioning
- Keeping core game logic separate from rendering concerns
- Maintaining feature parity with other implementations

## License

See the LICENSE file in the root directory of this project for licensing information. 