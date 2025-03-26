/**
 * Types for AI actions and decisions
 */

export interface AIAction {
  type: 'draw' | 'install' | 'advance' | 'score' | 'end';
  target?: string;
  card?: string;
  server?: string;
}

export interface RunHistoryEntry {
  target: string;
  success: boolean;
  cardsAccessed: number;
}

export interface AIState {
  credits: number;
  memory: number;
  installedPrograms: string[];
  serverStrengths: Record<string, number>;
}
