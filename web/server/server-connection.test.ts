import * as http from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket } from 'socket.io-client';
import { setupTestServer, connectAndJoinGame, setupTestConsole, wait } from './test-helpers';
import type { TestServerSetup } from './test-helpers';
import type { ConsoleSilencer } from '../src/test/test-utils';

describe('Server Connection Handling', () => {
  let testSetup: TestServerSetup;
  let consoleControl: ConsoleSilencer;
  
  beforeAll(async () => {
    consoleControl = setupTestConsole();
    testSetup = await setupTestServer();
  });
  
  afterAll(async () => {
    consoleControl.restore();
    await testSetup.cleanup();
  });
  
  it('should emit listening event when server starts', async () => {
    const server = http.createServer();
    const serverSocket = new Server(server);
    
    await new Promise<void>((resolve) => {
      server.once('listening', () => {
        expect(server.listening).toBe(true);
        resolve();
      });
      
      server.listen(0); // Use random port
    });
    
    server.close();
  });
  
  it('should handle basic socket connection', async () => {
    const client = ioc(testSetup.clientUrl, {
      autoConnect: false,
      reconnection: false,
      timeout: 1000,
    });
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 1000);
      
      client.on('connect', () => {
        clearTimeout(timeout);
        expect(client.connected).toBe(true);
        resolve();
      });
      
      client.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      client.connect();
    });
    
    client.disconnect();
  });
  
  it('should handle player_join event', async () => {
    const client = ioc(testSetup.clientUrl, {
      autoConnect: false,
      reconnection: false,
      timeout: 1000,
    });
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 1000);
      
      client.on('connect', () => {
        clearTimeout(timeout);
        client.emit('player_join', { playerName: 'TestPlayer' });
        resolve();
      });
      
      client.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      client.connect();
    });
    
    client.disconnect();
  });
  
  it('should handle request_player_details event', async () => {
    const client = ioc(testSetup.clientUrl, {
      autoConnect: false,
      reconnection: false,
      timeout: 1000,
    });
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 1000);
      
      client.on('connect', () => {
        clearTimeout(timeout);
        client.emit('player_join', { playerName: 'TestPlayer' });
        client.emit('request_player_details');
        resolve();
      });
      
      client.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      client.connect();
    });
    
    client.disconnect();
  });
  
  it('should emit player_joined event after player_join', async () => {
    const client = ioc(testSetup.clientUrl, {
      autoConnect: false,
      reconnection: false,
      timeout: 1000,
    });
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 1000);
      
      // Add debug logging for all events
      client.onAny((event, ...args) => {
        console.log(`Received event: ${event}`, args);
      });
      
      client.on('connect', () => {
        console.log('Client connected');
        client.emit('player_join', { playerName: 'TestPlayer' });
        console.log('Sent player_join event');
      });
      
      client.on('player_joined', (data) => {
        console.log('Received player_joined event:', data);
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.id).toBeDefined();
        expect(data.color).toBeDefined();
        expect(data.position).toBeDefined();
        resolve();
      });
      
      client.on('connect_error', (err) => {
        console.log('Connection error:', err);
        clearTimeout(timeout);
        reject(err);
      });
      
      client.on('disconnect', (reason) => {
        console.log('Client disconnected:', reason);
      });
      
      console.log('Connecting client...');
      client.connect();
    });
    
    client.disconnect();
  });
  
  it('should handle multiple concurrent connections', async () => {
    const clients: Socket[] = [];
    const numClients = 3;
    
    try {
      await Promise.all(
        Array.from({ length: numClients }, (_, i) => 
          new Promise<void>((resolve, reject) => {
            const client = ioc(testSetup.clientUrl, {
              autoConnect: false,
              reconnection: false,
              timeout: 1000,
            });
            
            clients.push(client);
            
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, 1000);
            
            client.on('connect', () => {
              clearTimeout(timeout);
              client.emit('player_join', { playerName: `Player${i}` });
              client.emit('request_player_details');
              resolve();
            });
            
            client.on('connect_error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
            
            client.connect();
          })
        )
      );
      
      // Verify all clients are connected
      expect(clients.length).toBe(numClients);
      expect(clients.every(c => c.connected)).toBe(true);
      
    } finally {
      // Clean up all clients
      clients.forEach(client => client.disconnect());
    }
  });
}); 