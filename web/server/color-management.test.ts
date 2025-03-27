import { setupTestServer, connectAndJoinGame, setupTestConsole, wait, type PlayerJoinedEvent } from './test-helpers';
import type { Socket } from 'socket.io-client';
import type { TestServerSetup } from './test-helpers';
import type { ConsoleSilencer } from '../src/test/test-utils';

describe('Color Management', () => {
  let testSetup: TestServerSetup;
  let consoleControl: ConsoleSilencer;
  
  beforeAll(async () => {
    // Silence console output
    consoleControl = setupTestConsole();
    
    // Setup test server
    testSetup = await setupTestServer();
  });
  
  afterAll(async () => {
    consoleControl.restore();
    
    // Clean up test server
    await testSetup.cleanup();
  });
  
  // Skip these tests in CI environment or when socket testing is disabled
  const shouldSkipTest = (): boolean => {
    return process.env.CI === 'true' || process.env.SKIP_SOCKET_TESTS === 'true';
  };
  
  // Increase test timeout for socket operations
  jest.setTimeout(2000);
  
  it('assigns unique colors from predefined pool', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let client1: Socket | null = null;
    let client2: Socket | null = null;
    let player1Color: PlayerJoinedEvent['color'] | null = null;
    let player2Color: PlayerJoinedEvent['color'] | null = null;
    
    try {
      // Connect first client and store color
      client1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      
      // Wait for self_data event
      await new Promise<void>((resolve) => {
        client1!.once('self_data', (data: PlayerJoinedEvent) => {
          player1Color = data.color;
          resolve();
        });
      });
      
      // Connect second client and store color
      client2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      
      // Wait for self_data event
      await new Promise<void>((resolve) => {
        client2!.once('self_data', (data: PlayerJoinedEvent) => {
          player2Color = data.color;
          resolve();
        });
      });
      
      // Verify the colors are different
      expect(player1Color).not.toEqual(player2Color);
      
      // Clean up
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
      await wait(10);
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
      throw err;
    }
  });
  
  it('recycles colors when players disconnect', async () => {
    // Skip in CI environment
    if (shouldSkipTest()) {
      return;
    }
    
    let client1: Socket | null = null;
    let client2: Socket | null = null;
    let client3: Socket | null = null;
    let player1Color: PlayerJoinedEvent['color'] | null = null;
    let player3Color: PlayerJoinedEvent['color'] | null = null;
    
    try {
      // Connect first client and store color
      client1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      
      // Wait for self_data event
      await new Promise<void>((resolve) => {
        client1!.once('self_data', (data: PlayerJoinedEvent) => {
          player1Color = data.color;
          resolve();
        });
      });
      
      // Connect second client (we don't need its color)
      client2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      await wait(10);
      
      // Disconnect first client to free up its color
      client1.disconnect();
      await wait(25); // Wait for server to process disconnect
      
      // Connect third client - should get first client's color
      client3 = await connectAndJoinGame(testSetup.clientUrl, 'Player3');
      
      // Wait for self_data event
      await new Promise<void>((resolve) => {
        client3!.once('self_data', (data: PlayerJoinedEvent) => {
          player3Color = data.color;
          resolve();
        });
      });
      
      // Verify third player got first player's color
      expect(player3Color).toEqual(player1Color);
      
      // Clean up
      if (client1 && client1.connected) client1.disconnect();
      if (client2) client2.disconnect();
      if (client3) client3.disconnect();
      await wait(10);
    } catch (err) {
      // Even if the test fails, make sure we clean up
      if (client1 && client1.connected) client1.disconnect();
      if (client2) client2.disconnect();
      if (client3) client3.disconnect();
      throw err;
    }
  });
}); 