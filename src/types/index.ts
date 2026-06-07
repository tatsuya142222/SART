export type Condition = 'A' | 'B';
export type TrialType = 'practice' | 'test';
export type FeedbackType = 'excellent' | 'fast' | 'good' | 'slow' | 'commission_error' | 'omission_error' | 'correct_inhibit' | null;

export interface Participant {
  id?: string;
  participant_code: string;
  condition: Condition;
  age: number;
  gender: string;
  consent_given: boolean;
  created_at?: string;
  completed_at?: string;
}

export interface TrialData {
  participant_id: string;
  participant_code: string;
  block_number: number;
  trial_index: number;
  trial_type: TrialType;
  stimulus_digit: number;
  font_size: number;
  is_target: boolean;
  response: string | null;
  rt: number | null;
  correct: boolean;
  timestamp: number;
}

export interface QuestionnaireResponse {
  participant_id: string;
  participant_code: string;
  questionnaire_type: 'IMI' | 'NASA-TLX';
  item_code: string;
  score: number;
}

export interface ConsentFormData {
  participant_id: string;
  furigana: string;
  signature: string;
  email: string;
  signed_at: string;
}

export interface ExperimentState {
  participantId: string;
  condition: Condition;
  currentBlock: number;
  totalCorrect: number;
  totalTrials: number;
  points: number;
}
