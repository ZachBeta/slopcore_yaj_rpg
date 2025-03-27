// Unit types to replace primitive numbers
export type Seconds = number;
export type Milliseconds = number;
export type UnitInterval = number; // A number between 0 and 1
export type Coordinate = number; // A spatial coordinate
export type Degree = number; // Angle in degrees
export type FramesPerSecond = number; // FPS metric
export type Count = number; // Generic count of items
export type Dimension = number; // Size dimension in game units
export type Percentage = number; // A number between 0 and 100

// Identifier types
export type PlayerId = string;
export type ColorCode = string; // Hex color code

export interface Color {
  r: UnitInterval;
  g: UnitInterval;
  b: UnitInterval;
}

export interface Position {
  x: Coordinate;
  y: Coordinate;
  z: Coordinate;
}

export interface Rotation {
  _x: number;  // Quaternion components
  _y: number;
  _z: number;
  _w: number;
}

export interface Player {
  id: PlayerId;
  position: Position;
  rotation: Rotation;
  color: Color;
  lastActivity: Milliseconds;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface ServerDiagnostics {
  uptime: Seconds;
  fps: FramesPerSecond;
  playerCount: Count;
  colorPoolSize: Count;
  availableColors: Count;
  lockedColors: Count;
  randomColors: Count;
  connections: Count;
}

export type ObstacleType = 'cube' | 'cylinder';

export interface ObstacleData {
  type: ObstacleType;
  position: Position;
  scale: Position;
  color: Color;
  size?: Dimension;
  radius?: Dimension;
  height?: Dimension;
}

export interface MapData {
  worldSize: Dimension;
  obstacles: ObstacleData[];
}

export interface StateVerificationResult {
  colorDrift: UnitInterval;
  positionDrift: Dimension;
  expectedState: {
    color: Color;
    position: Position;
  };
  needsCorrection: boolean;
  timestamp: Milliseconds;
}

export interface ClientStateResponse {
  position: Position;
  color: Color;
  timestamp: Milliseconds;
}

export interface DebugState {
  players: {
    id: PlayerId;
    position: Position;
    color: Color;
    expectedColor?: Color;
  }[];
  colorPool: {
    available: Color[];
    locked: [PlayerId, Color][];
    random: Color[];
    total: Color[];
  };
  diagnostics: {
    connections: number;
    totalMessages: number;
    averageUpdateRate: number;
    playerCount: number;
    startTime: number;
    uptime: number;
  };
}
