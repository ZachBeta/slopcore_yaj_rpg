import { Game } from '../game';
import { TerminalGame } from '../terminal-game/terminal-game';

declare global {
  var game: Game;
  var testMockGame: TerminalGame;
} 