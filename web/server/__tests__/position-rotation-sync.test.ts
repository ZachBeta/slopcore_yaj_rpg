import { GameEvent } from '../../src/constants';
import { setupTestServer, connectAndJoinGame, setupTestConsole, wait, disconnectAll } from '../test-helpers';
import type { Socket } from 'socket.io-client';
import type { TestServerSetup } from '../test-helpers';
import type { ConsoleSilencer } from '../../src/test/test-utils';
import type { Position, Rotation } from '../../src/types';
import { ROTATION } from '../../src/constants/directions';

describe('Position and Rotation Synchronization Tests', () => {
  let testSetup: TestServerSetup;
  let consoleControl: ConsoleSilencer;
  
  beforeAll(async () => {
    consoleControl = setupTestConsole();
    testSetup = await setupTestServer();
  });
  
  afterEach(async () => {
    await disconnectAll();
  });
  
  afterAll(async () => {
    consoleControl.restore();
    await testSetup.cleanup();
  }, 5000);
  
  // Skip tests in CI environment
  const shouldSkipTest = (): boolean => {
    return process.env.CI === 'true' || process.env.SKIP_SOCKET_TESTS === 'true';
  };

  it('should handle extreme position values correctly', async () => {
    if (shouldSkipTest()) return;

    let socketClient1: Socket | null = null;
    let socketClient2: Socket | null = null;

    try {
      // Connect two clients
      const result1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      socketClient1 = result1.client;
      const player1Id = result1.player.id;

      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;

      // Test extreme position values
      const extremePositions: Position[] = [
        { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER, z: Number.MAX_SAFE_INTEGER },
        { x: Number.MIN_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER, z: Number.MIN_SAFE_INTEGER },
        { x: 0, y: 0, z: 0 },
        { x: 1e10, y: 1e10, z: 1e10 },
        { x: -1e10, y: -1e10, z: -1e10 }
      ];

      let receivedPositions: Position[] = [];
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          receivedPositions.push(data.position);
        }
      });

      // Send each extreme position
      for (const position of extremePositions) {
        socketClient1.emit(GameEvent.POSITION_UPDATE, {
          position,
          rotation: { x: 0, y: 0, z: 0 }
        });
        await wait(50);
      }

      await wait(100);

      // Verify all positions were received correctly
      expect(receivedPositions.length).toBe(extremePositions.length);
      receivedPositions.forEach((pos, index) => {
        expect(pos).toEqual(extremePositions[index]);
      });
    } finally {
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    }
  });

  it('should handle all rotation axes and limits correctly', async () => {
    if (shouldSkipTest()) return;

    let socketClient1: Socket | null = null;
    let socketClient2: Socket | null = null;

    try {
      // Connect two clients
      const result1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      socketClient1 = result1.client;
      const player1Id = result1.player.id;

      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;

      // Test various rotation combinations
      const rotations: Rotation[] = [
        // Test pitch limits (x-axis)
        { x: ROTATION.MAX_PITCH, y: 0, z: 0 },
        { x: ROTATION.MIN_PITCH, y: 0, z: 0 },
        // Test full yaw rotation (y-axis)
        { x: 0, y: Math.PI, z: 0 },
        { x: 0, y: -Math.PI, z: 0 },
        { x: 0, y: Math.PI / 2, z: 0 },
        { x: 0, y: -Math.PI / 2, z: 0 },
        // Test roll (z-axis)
        { x: 0, y: 0, z: Math.PI / 4 },
        { x: 0, y: 0, z: -Math.PI / 4 },
        // Test combined rotations
        { x: ROTATION.MAX_PITCH / 2, y: Math.PI / 4, z: Math.PI / 4 },
        { x: ROTATION.MIN_PITCH / 2, y: -Math.PI / 4, z: -Math.PI / 4 }
      ];

      let receivedRotations: Rotation[] = [];
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          receivedRotations.push(data.rotation);
        }
      });

      // Send each rotation
      for (const rotation of rotations) {
        socketClient1.emit(GameEvent.POSITION_UPDATE, {
          position: { x: 0, y: 0, z: 0 },
          rotation
        });
        await wait(50);
      }

      await wait(100);

      // Verify all rotations were received correctly
      expect(receivedRotations.length).toBe(rotations.length);
      receivedRotations.forEach((rot, index) => {
        expect(rot).toEqual(rotations[index]);
      });
    } finally {
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    }
  });

  it('should handle rapid position and rotation updates', async () => {
    if (shouldSkipTest()) return;

    let socketClient1: Socket | null = null;
    let socketClient2: Socket | null = null;

    try {
      // Connect two clients
      const result1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      socketClient1 = result1.client;
      const player1Id = result1.player.id;

      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;

      // Generate rapid movement sequence
      const updates = Array.from({ length: 20 }, (_, i) => ({
        position: {
          x: Math.sin(i * 0.5) * 10,
          y: Math.abs(Math.cos(i * 0.3)) * 5,
          z: Math.cos(i * 0.5) * 10
        },
        rotation: {
          x: Math.max(ROTATION.MIN_PITCH, Math.min(ROTATION.MAX_PITCH, Math.sin(i * 0.2))),
          y: (i * Math.PI / 10) % (Math.PI * 2),
          z: Math.sin(i * 0.1) * (Math.PI / 4)
        }
      }));

      let receivedUpdates: { position: Position; rotation: Rotation }[] = [];
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          receivedUpdates.push({
            position: data.position,
            rotation: data.rotation
          });
        }
      });

      // Send updates rapidly
      for (const update of updates) {
        socketClient1.emit(GameEvent.POSITION_UPDATE, update);
        await wait(20); // Small delay to prevent overwhelming
      }

      await wait(100);

      // Verify updates were received in order
      expect(receivedUpdates.length).toBe(updates.length);
      receivedUpdates.forEach((update, index) => {
        expect(update.position).toEqual(updates[index].position);
        expect(update.rotation).toEqual(updates[index].rotation);
      });
    } finally {
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    }
  });

  it('should maintain precision in position and rotation values', async () => {
    if (shouldSkipTest()) return;

    let socketClient1: Socket | null = null;
    let socketClient2: Socket | null = null;

    try {
      // Connect two clients
      const result1 = await connectAndJoinGame(testSetup.clientUrl, 'Player1');
      socketClient1 = result1.client;
      const player1Id = result1.player.id;

      const result2 = await connectAndJoinGame(testSetup.clientUrl, 'Player2');
      socketClient2 = result2.client;

      // Test precise values
      const preciseUpdates = [
        {
          position: { x: 1.23456789, y: 2.34567891, z: 3.45678912 },
          rotation: { x: 0.12345678, y: 0.23456789, z: 0.34567891 }
        },
        {
          position: { x: -1.23456789, y: -2.34567891, z: -3.45678912 },
          rotation: { x: -0.12345678, y: -0.23456789, z: -0.34567891 }
        },
        {
          position: { x: Math.PI, y: Math.E, z: Math.SQRT2 },
          rotation: { x: Math.PI / 6, y: Math.PI / 4, z: Math.PI / 3 }
        }
      ];

      let receivedUpdates: { position: Position; rotation: Rotation }[] = [];
      socketClient2.on(GameEvent.PLAYER_MOVED, (data) => {
        if (data.id === player1Id) {
          receivedUpdates.push({
            position: data.position,
            rotation: data.rotation
          });
        }
      });

      // Send precise updates
      for (const update of preciseUpdates) {
        socketClient1.emit(GameEvent.POSITION_UPDATE, update);
        await wait(50);
      }

      await wait(100);

      // Verify precision was maintained
      expect(receivedUpdates.length).toBe(preciseUpdates.length);
      receivedUpdates.forEach((update, index) => {
        // Check each coordinate with high precision
        ['x', 'y', 'z'].forEach(coord => {
          expect(update.position[coord]).toBeCloseTo(preciseUpdates[index].position[coord], 8);
          expect(update.rotation[coord]).toBeCloseTo(preciseUpdates[index].rotation[coord], 8);
        });
      });
    } finally {
      if (socketClient1) socketClient1.disconnect();
      if (socketClient2) socketClient2.disconnect();
    }
  });
}); 