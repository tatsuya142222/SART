import { EXPERIMENT_CONFIG } from '../config/experiment';
import type { FeedbackType } from '../types';

export interface GamificationState {
  points: number;
  currentTrialInBlock: number;
  trialsPerBlock: number;
}

export function createGamificationState(trialsPerBlock: number): GamificationState {
  return { points: 0, currentTrialInBlock: 0, trialsPerBlock };
}

export function calcFeedback(isTarget: boolean, response: string | null, rt: number | null): FeedbackType {
  if (isTarget && response === null) return 'correct_inhibit';
  if (isTarget && response !== null) return 'commission_error';
  if (!isTarget && response === null) return null;

  if (rt === null) return null;
  if (rt < EXPERIMENT_CONFIG.RT_FAST_THRESHOLD) return 'fast';
  if (rt <= EXPERIMENT_CONFIG.RT_SLOW_THRESHOLD) return 'good';
  return 'slow';
}

export function updatePoints(state: GamificationState, feedback: FeedbackType): GamificationState {
  const gainPoints = feedback === 'fast' || feedback === 'good' || feedback === 'slow' || feedback === 'correct_inhibit';
  return {
    ...state,
    points: state.points + (gainPoints ? EXPERIMENT_CONFIG.POINTS_PER_CORRECT : 0),
    currentTrialInBlock: state.currentTrialInBlock + 1,
  };
}
