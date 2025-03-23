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