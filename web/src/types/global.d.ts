import { Game } from '../game';
import { TerminalGame } from '../terminal-game/terminal-game';

declare global {
  interface Window {
    game?: Game;
    testMockGame?: Partial<TerminalGame>;
  }
  var game: Game | undefined;
  var testMockGame: Partial<TerminalGame> | undefined;
}
