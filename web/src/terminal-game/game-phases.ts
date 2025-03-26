/**
 * Game phases for the terminal game
 */
export enum GamePhase {
  SETUP = 'setup',
  START_TURN = 'start_turn',
  ACTION = 'action',
  DISCARD = 'discard',
  END_TURN = 'end_turn',
  CLEANUP = 'cleanup',
  GAME_OVER = 'game_over',
}
