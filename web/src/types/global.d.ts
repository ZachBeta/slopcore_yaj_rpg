import { Game } from '../game';
import { TerminalGame } from '../terminal-game/terminal-game';

declare global {
  interface Window {
    game?: Game;
    testMockGame?: Partial<TerminalGame>;
  }
  let game: Game | undefined;
  let testMockGame: Partial<TerminalGame> | undefined;
}
