import { Socket as ClientSocket } from 'socket.io-client';
import { createSocketTestEnvironment } from './test-helpers';
import { GameServer } from './game-server';
import { Player } from '../src/types';

describe('Color Management', () => {
  let testEnv: Awaited<ReturnType<typeof createSocketTestEnvironment>>;
  let gameServer: GameServer;
  const clients: ClientSocket[] = [];
  const players: Player[] = [];
  const TEST_TIMEOUT = 5000;

  beforeAll(async () => {
    // Keep console logs but add timestamp
    const originalConsoleLog = console.log;
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      originalConsoleLog(`[${new Date().toISOString()}] [ColorTest]`, ...args);
    });

    // Create test environment
    testEnv = await createSocketTestEnvironment();
    gameServer = testEnv.gameServer;
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log('Cleaning up after all tests');
    jest.restoreAllMocks();
    
    // Clean up test environment
    await testEnv.cleanup();
  }, TEST_TIMEOUT);

  beforeEach(() => {
    console.log('Resetting server state');
    
    // Reset game server state
    gameServer.clearPlayers();
    gameServer.clearLockedColors();
    gameServer.clearUsedRandomColors();
    
    // Reset available colors to full pool
    gameServer.setAvailableColors([...gameServer.getColorPool()]);
  });

  afterEach(() => {
    // Disconnect all clients
    clients.forEach(client => {
      if (client.connected) {
        client.disconnect();
      }
    });
    clients.length = 0;
    players.length = 0;
  });

  test('assigns unique colors from predefined pool', async () => {
    // Connect first client
    const client1 = testEnv.createClient();
    clients.push(client1);
    const { player: player1 } = await testEnv.connectAndJoin(client1);
    players.push(player1);
    expect(player1.color).toBeDefined();
    expect(player1.color.r).toBeGreaterThanOrEqual(0);
    expect(player1.color.g).toBeGreaterThanOrEqual(0);
    expect(player1.color.b).toBeGreaterThanOrEqual(0);

    // Connect second client
    const client2 = testEnv.createClient();
    clients.push(client2);
    const { player: player2 } = await testEnv.connectAndJoin(client2);
    players.push(player2);
    expect(player2.color).toBeDefined();
    expect(player2.color.r).toBeGreaterThanOrEqual(0);
    expect(player2.color.g).toBeGreaterThanOrEqual(0);
    expect(player2.color.b).toBeGreaterThanOrEqual(0);

    // Colors should be different
    expect(player1.color).not.toEqual(player2.color);
  }, TEST_TIMEOUT);

  test('recycles colors when players disconnect', async () => {
    // Connect first client
    const client1 = testEnv.createClient();
    clients.push(client1);
    const { player: player1 } = await testEnv.connectAndJoin(client1);
    const color1 = player1.color;

    // Disconnect first client
    client1.disconnect();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Connect second client
    const client2 = testEnv.createClient();
    clients.push(client2);
    const { player: player2 } = await testEnv.connectAndJoin(client2);

    // Second player should get the recycled color
    expect(player2.color).toEqual(color1);
  }, TEST_TIMEOUT);
}); 