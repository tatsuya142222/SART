import { EXPERIMENT_CONFIG } from '../config/experiment';
import type { FeedbackType } from '../types';

export interface GamificationState {
  streak: number;
}

export function createGamificationState(): GamificationState {
  return { streak: 0 };
}

export function calcFeedback(isTarget: boolean, response: string | null, rt: number | null): FeedbackType {
  if (isTarget && response === null) return 'correct_inhibit';
  if (isTarget && response !== null) return 'commission_error';
  if (!isTarget && response === null) return 'omission_error';

  if (rt === null) return null;
  if (rt < EXPERIMENT_CONFIG.RT_EXCELLENT_THRESHOLD) return 'excellent';
  if (rt < EXPERIMENT_CONFIG.RT_FAST_THRESHOLD) return 'fast';
  if (rt <= EXPERIMENT_CONFIG.RT_SLOW_THRESHOLD) return 'good';
  return 'slow';
}

export function updateStreak(state: GamificationState, correct: boolean): GamificationState {
  return { streak: correct ? state.streak + 1 : 0 };
}
