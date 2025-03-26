import { MapData, Player, Position, Rotation, ServerDiagnostics } from './types';

export enum GameEvent {
  // Player events
  PLAYER_JOIN = 'player_join',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEAVE = 'player_leave',
  PLAYER_LEFT = 'player_left',
  PLAYER_MOVED = 'player_moved',
  POSITION_UPDATE = 'position_update',
  ROTATION_UPDATE = 'rotation_update',
  PLAYERS_LIST = 'players_list',
  MAP_DATA = 'map_data',

  // Game state events
  GAME_STATE_UPDATE = 'game_state_update',
  SERVER_DIAGNOSTICS = 'server_diagnostics',

  // Connection events
  CONNECTION_STATUS = 'connection_status',
  CONNECTION_ERROR = 'connection_error',

  // Game control events
  START_GAME = 'start_game',
  PAUSE_GAME = 'pause_game',
  RESUME_GAME = 'resume_game',
  STOP_GAME = 'stop_game',

  // Chat events
  CHAT_MESSAGE = 'chat_message',

  // Network events
  PING = 'ping',
  PONG = 'pong',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// UI Element IDs
export enum ElementId {
  START_BUTTON = 'start-button',
  OPTIONS_BUTTON = 'options-button',
  ABOUT_BUTTON = 'about-button',
  MENU_CONTAINER = 'menu-container',
  CANVAS_CONTAINER = 'canvas-container',
  BACK_BUTTON = 'back-button',
}

// Game configuration
export const GAME_CONFIG = {
  MAX_PLAYERS: 100,
  UPDATE_RATE: 60,
  COLOR_MIN_DISTANCE: 0.3,
  COLOR_POOL_SIZE: 100,
  SPAWN_RADIUS: 50,
  CAMERA_DISTANCE: 10,
  CAMERA_HEIGHT: 2,
} as const;

// Event Payload Types
export interface GameEventPayloads {
  [GameEvent.PLAYER_JOIN]: { position?: Position; rotation?: Rotation };
  [GameEvent.PLAYER_JOINED]: Player;
  [GameEvent.PLAYER_LEAVE]: { id: string };
  [GameEvent.PLAYER_LEFT]: string;
  [GameEvent.PLAYER_MOVED]: { id: string; position: Position; rotation: Rotation };
  [GameEvent.POSITION_UPDATE]: { position: Position; rotation: Rotation };
  [GameEvent.ROTATION_UPDATE]: Rotation;
  [GameEvent.PLAYERS_LIST]: Player[];
  [GameEvent.MAP_DATA]: MapData;
  [GameEvent.GAME_STATE_UPDATE]: { state: string; data: unknown };
  [GameEvent.SERVER_DIAGNOSTICS]: ServerDiagnostics;
  [GameEvent.CONNECTION_STATUS]: ConnectionStatus;
  [GameEvent.CONNECTION_ERROR]: { message: string; code?: string };
  [GameEvent.START_GAME]: void;
  [GameEvent.PAUSE_GAME]: void;
  [GameEvent.RESUME_GAME]: void;
  [GameEvent.STOP_GAME]: void;
  [GameEvent.CHAT_MESSAGE]: { id: string; message: string };
  [GameEvent.PING]: void;
  [GameEvent.PONG]: { timestamp: number };
}

// Type-safe event emitter interface
export interface GameEventEmitter {
  on<T extends GameEvent>(event: T, listener: (payload: GameEventPayloads[T]) => void): void;
  emit<T extends GameEvent>(event: T, payload: GameEventPayloads[T]): void;
  off<T extends GameEvent>(event: T, listener: (payload: GameEventPayloads[T]) => void): void;
}
