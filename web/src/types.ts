export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  position: Position;
  rotation: Rotation;
  color: Color;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface ServerDiagnostics {
  uptime: number;
  fps: number;
  playerCount: number;
  colorPoolSize: number;
  availableColors: number;
  lockedColors: number;
  randomColors: number;
  connections: number;
}

export interface ObstacleData {
  type: 'cube' | 'cylinder';
  position: Position;
  scale: Position;
  color: Color;
  size?: number;
  radius?: number;
  height?: number;
}

export interface MapData {
  worldSize: number;
  obstacles: ObstacleData[];
}

export interface StateVerificationResult {
  colorDrift: number;
  positionDrift: number;
  expectedState: {
    color: Color;
    position: Position;
  };
  needsCorrection: boolean;
  timestamp: number;
}

export interface ClientStateResponse {
  position: Position;
  color: Color;
  timestamp: number;
}

export interface DebugState {
  players: {
    id: string;
    position: Position;
    color: Color;
    expectedColor?: Color;
  }[];
  colorPool: {
    available: Color[];
    locked: [string, Color][];
    random: Color[];
    total: Color[];
  };
  diagnostics: ServerDiagnostics;
} 