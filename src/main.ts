import { initJsPsych } from 'jspsych';
import 'jspsych/css/jspsych.css';
import '../styles/base.css';
import '../styles/experiment.css';
import '../styles/gamification.css';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import type { Condition, TrialData, QuestionnaireResponse } from './types';
import { buildConsentTrial, buildConsentFormTrial, buildWithdrawalInfoTrial } from './experiment/consent';
import { buildInstructionTrials } from './experiment/instructions';
import {
  buildSartBlock,
  buildBreakTrial,
  buildPracticeResultTrial,
  buildBlockStartTrial,
} from './experiment/sart';
import { buildImiTrial, buildNasaTlxTrial } from './experiment/questionnaire';
import { saveTrials, saveQuestionnaire, markCompleted } from './supabase/save';
import { EXPERIMENT_CONFIG } from './config/experiment';

// --- 条件判定 ---
const params = new URLSearchParams(window.location.search);
const rawCondition = params.get('condition');

if (rawCondition !== 'A' && rawCondition !== 'B') {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                height:100vh;font-family:sans-serif;text-align:center;">
      <h2>このリンクは無効です</h2>
      <p>実験担当者からお送りしたURLからアクセスしてください。</p>
    </div>
  `;
  throw new Error('Invalid condition parameter');
}

const condition = rawCondition as Condition;

// --- 実験データ蓄積領域 ---
const collectedTrials: TrialData[] = [];
const collectedResponses: QuestionnaireResponse[] = [];
let participantId = '';
let participantCode = '';

// --- jsPsych 初期化 ---
const jsPsych = initJsPsych({
  display_element: 'jspsych-target',
  on_finish: async () => {
    try {
      await saveTrials(collectedTrials);
      await saveQuestionnaire(collectedResponses);
      await markCompleted(participantId);
    } catch (e) {
      console.error('データ保存エラー:', e);
    }
  },
});

// --- タイムライン構築 ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const timeline: any[] = [];

// 説明書
timeline.push(buildConsentTrial());

// 同意書フォーム（参加者登録）
timeline.push(
  buildConsentFormTrial(condition, (id, code) => {
    participantId = id;
    participantCode = code;
  }),
);

// 同意撤回・中断案内
timeline.push(buildWithdrawalInfoTrial());

// 教示
timeline.push(...buildInstructionTrials(condition));

// 練習試行
timeline.push(...buildSartBlock(jsPsych, () => participantId, condition, 0, 'practice', collectedTrials));
timeline.push(buildPracticeResultTrial(collectedTrials));

// 本試行（3ブロック）
for (let block = 1; block <= EXPERIMENT_CONFIG.NUM_BLOCKS; block++) {
  timeline.push(buildBlockStartTrial(block));
  timeline.push(...buildSartBlock(jsPsych, () => participantId, condition, block, 'test', collectedTrials));
  if (block < EXPERIMENT_CONFIG.NUM_BLOCKS) {
    timeline.push(buildBreakTrial(block));
  }
}

// アンケート
timeline.push(buildImiTrial(() => participantId, collectedResponses));
timeline.push(buildNasaTlxTrial(() => participantId, collectedResponses));

// 終了画面
timeline.push({
  type: htmlButtonResponse,
  stimulus: () => `
    <div class="end-container">
      <h2>実験終了</h2>
      <p>ご参加ありがとうございました。</p>
      <p>参加者コード：<strong>${participantCode}</strong></p>
      <p class="end-note">単位申請等で必要な場合はこのコードをメモしてください。</p>
      <hr>
      <p>ご不明な点は以下までご連絡ください。<br>E-mail: research@example.ac.jp</p>
    </div>
  `,
  choices: [],
  trial_duration: null,
});

// 実験開始
jsPsych.run(timeline);
