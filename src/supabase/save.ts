import { supabase } from './client';
import type { Participant, TrialData, QuestionnaireResponse, ConsentFormData } from '../types';

export async function createParticipant(data: Omit<Participant, 'id' | 'created_at' | 'completed_at'>): Promise<string> {
  const { data: result, error } = await supabase
    .from('participants')
    .insert(data)
    .select('id')
    .single();

  if (error) throw new Error(`参加者データの作成に失敗しました: ${error.message}`);
  return result.id;
}

export async function saveTrials(trials: TrialData[]): Promise<void> {
  const BATCH_SIZE = 100;
  for (let i = 0; i < trials.length; i += BATCH_SIZE) {
    const batch = trials.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('trials').insert(batch);
    if (error) throw new Error(`試行データの保存に失敗しました: ${error.message}`);
  }
}

export async function saveQuestionnaire(responses: QuestionnaireResponse[]): Promise<void> {
  const { error } = await supabase.from('questionnaire_responses').insert(responses);
  if (error) throw new Error(`アンケートデータの保存に失敗しました: ${error.message}`);
}

export async function saveConsentForm(data: ConsentFormData): Promise<void> {
  const { error } = await supabase.from('consent_forms').insert(data);
  if (error) throw new Error(`同意書データの保存に失敗しました: ${error.message}`);
}

export async function markCompleted(participantId: string): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', participantId);

  if (error) throw new Error(`完了マークの更新に失敗しました: ${error.message}`);
}
