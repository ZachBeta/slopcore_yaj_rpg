import { GameServer } from './game-server';
import { Color, Player } from '../src/types';
import { GameEvent } from '../src/constants';
import { TestSocket, TestServer, getColorKey, isColorUnique, simulatePlayerJoining } from './simple-test-helper';

// Make a test version of GameServer that allows access to protected members
class TestGameServer extends GameServer {
  constructor() {
    // Create a mock HTTP server that won't actually listen on a port
    const mockHttpServer = {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      listen: jest.fn(),
      close: jest.fn()
    } as any;
    
    super(mockHttpServer, 0, { isTestMode: true });
    
    // Replace the socket.io server with our mock
    this['io'] = {
      on: jest.fn((event, callback) => {
        if (event === 'connection') {
          this.connectionCallback = callback;
        }
      }),
      emit: jest.fn(),
      sockets: {
        sockets: new Map()
      }
    };
  }
  
  // Override to avoid actual server
  protected startDiagnostics(): void {
    // Do nothing in tests
  }
  
  // Access to protected members
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
  
  // Helper to connect a socket
  connectSocket(socket: TestSocket): void {
    if (this.connectionCallback) {
      this.connectionCallback(socket);
    }
  }
  
  // Connection callback storage
  private connectionCallback: (socket: TestSocket) => void;
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
    // Clean up
    gameServer.close();
    testServer.cleanup();
  });
  
  test('assigns unique colors to players', async () => {
    // Create multiple sockets
    const numPlayers = 5;
    const players: Player[] = [];
    
    for (let i = 0; i < numPlayers; i++) {
      const socket = testServer.createSocket();
      gameServer.connectSocket(socket);
      
      const player = await simulatePlayerJoining(socket);
      players.push(player);
    }
    
    // Verify each player has a unique color
    const usedColors = new Set<string>();
    
    // Check that each color is properly stored
    expect(gameServer.getPlayers().size).toBe(numPlayers);
    expect(gameServer.getLockedColors().size).toBe(numPlayers);
    
    players.forEach(player => {
      const colorKey = getColorKey(player.color);
      expect(usedColors.has(colorKey)).toBe(false);
      usedColors.add(colorKey);
    });
    
    // Verify colors are visually distinct
    for (let i = 0; i < players.length; i++) {
      const otherColors = players
        .filter((_, index) => index !== i)
        .map(p => p.color);
      
      expect(isColorUnique(players[i].color, otherColors)).toBe(true);
    }
  });
  
  test('recycles colors when players disconnect', async () => {
    // Create socket and player
    const socket = testServer.createSocket();
    gameServer.connectSocket(socket);
    
    const player = await simulatePlayerJoining(socket);
    
    // Verify initial state
    expect(gameServer.getPlayers().size).toBe(1);
    expect(gameServer.getLockedColors().size).toBe(1);
    
    const initialAvailableColors = gameServer.getAvailableColors().length;
    const playerColorKey = getColorKey(player.color);
    
    // Disconnect the player
    socket.emit('disconnect', 'test disconnect');
    
    // Verify color was recycled
    expect(gameServer.getPlayers().size).toBe(0);
    expect(gameServer.getLockedColors().size).toBe(0);
    expect(gameServer.getAvailableColors().length).toBe(initialAvailableColors + 1);
    
    // Check the specific color was returned to the pool
    const recycledColor = gameServer.getAvailableColors().find(color => 
      getColorKey(color) === playerColorKey
    );
    
    expect(recycledColor).toBeDefined();
  });
  
  test('handles player movement updates', async () => {
    // Create socket and player
    const socket = testServer.createSocket();
    gameServer.connectSocket(socket);
    
    const player = await simulatePlayerJoining(socket);
    
    // Prepare to capture broadcast
    const broadcastEvents: any[] = [];
    socket.on('broadcast', (event, data) => {
      broadcastEvents.push({ event, data });
    });
    
    // Send position update
    const newPosition = { x: 10, y: 1, z: 10 };
    const newRotation = { x: 0, y: Math.PI, z: 0 };
    
    socket.emit(GameEvent.POSITION_UPDATE, {
      position: newPosition,
      rotation: newRotation
    });
    
    // Verify player data was updated
    const updatedPlayer = gameServer.getPlayers().get(player.id);
    expect(updatedPlayer).toBeDefined();
    expect(updatedPlayer?.position).toEqual(newPosition);
    expect(updatedPlayer?.rotation).toEqual(newRotation);
  });
}); 