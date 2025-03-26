import { Card } from './card-data';
import { GamePhase } from './game-phases';
import { ConsoleRenderer } from './console-renderer';
import { AIOpponent } from './ai-opponent';

export { Card };

export interface Agenda extends Card {
  advancement: number;
  pointValue: number;
  advancementRequired: number;
}

// Numeric types
export type Credits = number;
export type MemoryUnits = number;
export type ClickCount = number;
export type TurnNumber = number;
export type AgendaPoints = number;
export type CardCount = number;
export type CardIndex = number;
export type RandomSeed = number;

// String types
export type PlayerSide = 'runner' | 'corp';
export type ServerName = 'R&D' | 'HQ' | 'Archives' | string;
export type CommandName = keyof typeof validCommands;
export type CardTrigger = 'turn_start' | 'turn_end' | 'run_start' | 'run_end';

// Game state types
export interface GameResources {
  credits: Credits;
  memoryAvailable: MemoryUnits;
  memoryUsed: MemoryUnits;
}

export interface TurnState {
  phase: GamePhase;
  clicksRemaining: ClickCount;
  maxClicks: ClickCount;
  turnNumber: TurnNumber;
  activePlayer: PlayerSide | null;
}

export interface WinState {
  runnerAgendaPoints: AgendaPoints;
  corpAgendaPoints: AgendaPoints;
  agendaPointsToWin: AgendaPoints;
  runnerCardsRemaining: CardCount;
  corpCardsRemaining: CardCount;
  gameOver: boolean;
  winMessage: string;
}

export interface CardState {
  playerDeck: Card[];
  handCards: Card[];
  playedCards: PlayedCard[];
  selectedCardIndex: CardIndex;
}

export interface RunState {
  active: boolean;
  server: ServerName;
  target: ServerName;
  phase: 'approach' | 'encounter' | 'access';
  encounterIndex: number;
  bypassNextIce: boolean;
  untraceable: boolean;
}

export interface CommandState {
  history: string[];
  historyIndex: number;
}

export interface GameComponents {
  renderer: ConsoleRenderer;
  aiOpponent: AIOpponent | null;
}

// Command documentation types
export interface CommandDoc {
  NAME: string;
  SYNOPSIS: string;
  DESCRIPTION: string;
  EXAMPLES: string;
  SEE_ALSO: string;
}

export interface CommandArguments {
  command: CommandName;
  args: string[];
  options: Record<string, string>;
}

export interface PlayedCard extends Card {
  installed: boolean;
  faceUp: boolean;
  rezzed?: boolean;
  recurringCredits?: number;
  memoryUsage?: number;
  installCost?: number;
}

export interface Server {
  name: ServerName;
  ice: PlayedCard[];
  cards: Card[];
  strength?: number;
  root?: Card | null;
}

export type CommandHandler = (args: string[]) => void;

export const validCommands = {
  help: 'Display a list of available commands',
  man: 'Display detailed manual for a command',
  draw: 'Draw a card from your deck (costs 1 click)',
  hand: 'Display cards in your hand',
  install: 'Install a card from your hand (costs 1 click)',
  run: 'Initiate a run on a server (costs 1 click)',
  end: 'End your turn',
  info: 'Display game information',
  discard: 'Discard a card from your hand',
  system: 'Display system status',
  installed: 'Display your installed cards',
  credits: 'Display your credit balance',
  memory: 'Display memory unit status',
  jack_out: 'Jack out of a run',
} as const;

export interface GameState {
  resources: GameResources;
  turn: TurnState;
  win: WinState;
  cards: CardState;
  run: RunState | null;
  command: CommandState;
  components: GameComponents;
  servers: Record<ServerName, Server>;
}

export interface RunHistoryEntry {
  server: ServerName;
  success: boolean;
  cardsAccessed: number;
  iceEncountered: number;
  creditsSpent: number;
}
