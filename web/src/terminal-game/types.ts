/**
 * Types and interfaces for Neon Dominance Terminal Game
 */
import { Card } from './card-data';
import { GamePhase } from './game-phases';

// Ice information for servers
export interface IceCard {
  name: string;
  type: string;
  subtype: string;
  strength: number;
  subroutines: number;
  description: string;
  flavor_text: string;
  ascii_art: string[];
}

// Information about a server
export interface Server {
  name: string;
  ice: IceCard[];
  strength: number;
  cards: Card[];
}

// Information about the current run
export interface RunState {
  active: boolean;
  target: string;
  iceIndex: number;
  iceEncountered: number[];
  successful: boolean;
  untraceable: boolean;
}

// Information about a played/installed card
export interface PlayedCard extends Card {
  playedId: number; // A unique instance ID separate from the card's string ID
  faceup: boolean;
}

// Command parser utilities
export interface CommandArguments {
  command?: string;
  args: string[];
  options: Record<string, string>;
}

// Game state for saving/loading
export interface GameState {
  // Player state
  playerCredits: number;
  memoryUnitsAvailable: number;
  memoryUnitsUsed: number;
  playerSide: string;
  opponentSide: string;
  
  // Game phases and turns
  currentPhase: GamePhase;
  clicksRemaining: number;
  maxClicks: number;
  turnNumber: number;
  activePlayer: string;
  
  // Win conditions
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  agendaPointsToWin: number;
  runnerCardsRemaining: number;
  corpCardsRemaining: number;
  gameOver: boolean;
  winMessage: string;
  
  // Card data
  playerDeck: Card[];
  handCards: Card[];
  playedCards: PlayedCard[];
  selectedCardIndex: number;
  
  // Special gameplay flags
  bypassNextIce: number;
  nextRunUntraceable: boolean;
  currentRun: RunState | null;
  
  // Command history
  commandHistory: string[];
  commandHistoryIndex: number;

  // Server data
  servers: Record<string, Server>;
}

// Command handler function
export type CommandHandler = (args: string[]) => void; 