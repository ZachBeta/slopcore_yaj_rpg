import { GameServer } from './game-server';
import { Color, Player } from '../src/types';
import { TestServer, getColorKey } from './simple-test-helper';
import { createServer, Server as HttpServer } from 'http';

// Create a class that extends GameServer but only adds accessor methods
// to the protected properties without trying to override private methods
export class TestGameServer extends GameServer {
  private httpServer: HttpServer;

  constructor() {
    // Use a real HTTP server that won't actually listen on a specific port
    const httpServer = createServer();
    super(httpServer, 0, { isTestMode: true });
    
    // Save reference to the HTTP server for proper cleanup
    this.httpServer = httpServer;
    
    // Initialize with a real server, but we won't actually use the network
    httpServer.listen(0);
  }

  // Get the port number the server is listening on
  getPort(): number {
    const address = this.httpServer.address();
    if (!address || typeof address === 'string') {
      return 0;
    }
    return address.port;
  }

  // Override close to ensure cleanup of both socket.io and HTTP servers
  close(): void {
    // First close the GameServer (socket.io server)
    super.close();
    
    // Then close the HTTP server
    if (this.httpServer && this.httpServer.listening) {
      this.httpServer.close();
    }
  }

  // Accessor methods for protected members
  getColorPool(): Color[] {
    return this.colorPool;
  }
  
  getAvailableColors(): Color[] {
    return this.availableColors;
  }
  
  getLockedColors(): Map<string, Color> {
    return this.lockedColors;
  }
  
  getUsedRandomColors(): Set<Color> {
    return this.usedRandomColors;
  }
  
  getPlayers(): Map<string, Player> {
    return this.players;
  }
  
  // Reset available colors for testing
  setAvailableColors(colors: Color[]): void {
    this.availableColors = colors;
  }
  
  // Clear player data for testing
  clearPlayers(): void {
    this.players.clear();
  }
  
  // Clear locked colors for testing
  clearLockedColors(): void {
    this.lockedColors.clear();
  }
  
  // Clear used random colors for testing
  clearUsedRandomColors(): void {
    this.usedRandomColors.clear();
  }
  
  // Directly add a player for testing
  addPlayer(socketId: string, player: Player): void {
    this.players.set(socketId, player);
    this.lockedColors.set(socketId, player.color);
    
    // Remove from available colors
    this.availableColors = this.availableColors.filter(
      color => getColorKey(color) !== getColorKey(player.color)
    );
  }
  
  // Directly remove a player for testing
  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      // Add color back to the pool
      this.availableColors.push(player.color);
      
      // Remove from maps
      this.players.delete(playerId);
      this.lockedColors.delete(playerId);
    }
  }
}

describe('Game Server Core Logic', () => {
  let gameServer: TestGameServer;
  let testServer: TestServer;
  
  beforeEach(() => {
    // Create a fresh server for each test
    gameServer = new TestGameServer();
    testServer = new TestServer();
  });
  
  afterEach(() => {
    // Explicit cleanup
    if (testServer) {
      testServer.cleanup();
    }
    if (gameServer) {
      gameServer.close();
    }
  });
  
  describe('Color Management', () => {
    test('provides unique colors from the pool', () => {
      // Create 5 players with colors from the pool
      const numPlayers = 5;
      const players: Player[] = [];
      
      // Get initial state
      const initialAvailableSize = gameServer.getAvailableColors().length;
      
      for (let i = 0; i < numPlayers; i++) {
        const playerId = `test-player-${i}`;
        const availableColors = gameServer.getAvailableColors();
        if (availableColors.length === 0) {
          throw new Error('No colors available');
        }
        const color = availableColors[0];
        if (!color) {
          throw new Error('Color is undefined');
        }
        
        const player: Player = {
          id: playerId,
          position: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          color: color,
          lastActivity: Date.now()
        };
        
        // Use our helper to add the player
        gameServer.addPlayer(playerId, player);
        players.push(player);
        
        // Verify state after each addition
        expect(gameServer.getPlayers().size).toBe(i + 1);
        expect(gameServer.getLockedColors().size).toBe(i + 1);
        expect(gameServer.getAvailableColors().length).toBe(initialAvailableSize - (i + 1));
      }
      
      // Verify each player got a unique color
      const colorKeys = new Set<string>();
      players.forEach(player => {
        const key = getColorKey(player.color);
        expect(colorKeys.has(key)).toBe(false);
        colorKeys.add(key);
      });
    });
    
    test('recycles colors when players disconnect', () => {
      // Create and add a player
      const playerId = 'test-player';
      const availableColors = gameServer.getAvailableColors();
      if (availableColors.length === 0) {
        throw new Error('No colors available');
      }
      const color = availableColors[0];
      if (!color) {
        throw new Error('Color is undefined');
      }
      
      const player: Player = {
        id: playerId,
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        color: color,
        lastActivity: Date.now()
      };
      
      // Track initial state
      const initialAvailableSize = gameServer.getAvailableColors().length;
      
      // Add player
      gameServer.addPlayer(playerId, player);
      
      // Verify player was added and color removed from pool
      expect(gameServer.getPlayers().size).toBe(1);
      expect(gameServer.getLockedColors().size).toBe(1);
      expect(gameServer.getAvailableColors().length).toBe(initialAvailableSize - 1);
      
      // Get the color key for later comparison
      const colorKey = getColorKey(color);
      
      // Remove player
      gameServer.removePlayer(playerId);
      
      // Verify player was removed and color returned to pool
      expect(gameServer.getPlayers().size).toBe(0);
      expect(gameServer.getLockedColors().size).toBe(0);
      expect(gameServer.getAvailableColors().length).toBe(initialAvailableSize);
      
      // Verify the exact same color was returned to the pool
      const recycledColor = gameServer.getAvailableColors().find(
        c => getColorKey(c) === colorKey
      );
      expect(recycledColor).toBeDefined();
    });
  });
  
  describe('Color Generation', () => {
    test('generatePlayerColor assigns unique colors', async () => {
      const id1 = 'player-1';
      const id2 = 'player-2';
      
      // Generate two colors
      const color1 = await gameServer.generatePlayerColor(id1);
      const color2 = await gameServer.generatePlayerColor(id2);
      
      // Verify they're different
      expect(getColorKey(color1)).not.toBe(getColorKey(color2));
      
      // Verify they're tracked correctly
      expect(gameServer.getLockedColors().has(id1)).toBe(true);
      expect(gameServer.getLockedColors().has(id2)).toBe(true);
      expect(getColorKey(gameServer.getLockedColors().get(id1)!)).toBe(getColorKey(color1));
      expect(getColorKey(gameServer.getLockedColors().get(id2)!)).toBe(getColorKey(color2));
    });
    
    test('generates random colors when pool is exhausted', async () => {
      // Empty the color pool
      gameServer.setAvailableColors([]);
      
      const id = 'player-random';
      const color = await gameServer.generatePlayerColor(id);
      
      // Verify a color was generated
      expect(color).toBeDefined();
      expect(gameServer.getLockedColors().has(id)).toBe(true);
      expect(getColorKey(gameServer.getLockedColors().get(id)!)).toBe(getColorKey(color));
      
      // Verify it was tracked as a random color
      expect(gameServer.getUsedRandomColors().size).toBe(1);
    });
  });

  it('should assign colors to players', async () => {
    const server = createServer();
    const gameServer = new TestGameServer(server, 0);
    const socketId = 'test-socket';
    const color = await gameServer.generatePlayerColor(socketId);
    
    expect(color).toBeDefined();
    expect(typeof color.r).toBe('number');
    expect(typeof color.g).toBe('number');
    expect(typeof color.b).toBe('number');

    const player: Player = {
      id: socketId,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      color,
      lastActivity: Date.now()
    };

    gameServer.addPlayer(socketId, player);
    
    const colorKey = getColorKey(color);
    expect(colorKey).toBeDefined();
  });
}); 