import { initJsPsych } from 'jspsych';
import 'jspsych/css/jspsych.css';
import '../styles/base.css';
import '../styles/experiment.css';
import '../styles/gamification.css';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
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
});

// --- タイムライン構築 ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const timeline: any[] = [];

// 説明書
timeline.push(buildConsentTrial());

// 同意書フォーム（参加者登録）
let registrationStatus: 'pending' | 'ok' | 'error' = 'pending';
timeline.push(
  buildConsentFormTrial(condition, (result) => {
    if (result.ok) {
      participantId = result.id;
      participantCode = result.code;
      registrationStatus = 'ok';
    } else {
      registrationStatus = 'error';
    }
  }),
);

// 登録完了の確認（参加者登録が完了するまで先へ進ませない）
// 失敗時はデータ保存先が確定しないため、実験を続行させず再読み込みを促す。
timeline.push({
  type: htmlButtonResponse,
  stimulus: `
    <div class="instruction-container">
      <h2>登録処理中</h2>
      <p>しばらくお待ちください…</p>
    </div>
  `,
  choices: [] as string[],
  trial_duration: null,
  on_load: () => {
    const REG_TIMEOUT_MS = 15000;
    const start = Date.now();
    const poll = setInterval(() => {
      if (registrationStatus === 'ok') {
        clearInterval(poll);
        jsPsych.finishTrial();
      } else if (registrationStatus === 'error' || Date.now() - start > REG_TIMEOUT_MS) {
        clearInterval(poll);
        const target = document.getElementById('jspsych-target');
        if (target) {
          target.innerHTML = `
            <div class="instruction-container">
              <h2>通信エラー</h2>
              <p>参加者登録に失敗しました。<br>
              ネットワーク接続を確認のうえ、下のボタンから再読み込みしてください。</p>
              <button class="jspsych-btn" id="reg-reload">再読み込み</button>
            </div>
          `;
          document.getElementById('reg-reload')
            ?.addEventListener('click', () => window.location.reload());
        }
      }
    }, 200);
  },
});

// 同意撤回・中断案内
timeline.push(buildWithdrawalInfoTrial());

// 教示
timeline.push(...buildInstructionTrials(condition));

// ブロックごとの逐次保存（途中離脱でも取得済みデータを失わないため）。
// collectedTrials のうち未保存分のみを送信し、savedTrialCount で二重送信を防ぐ。
let savedTrialCount = 0;
function buildBlockSaveTrial() {
  return {
    type: htmlKeyboardResponse,
    stimulus: '',
    choices: 'NO_KEYS',
    trial_duration: 0,
    on_finish: () => {
      const pending = collectedTrials.slice(savedTrialCount);
      savedTrialCount = collectedTrials.length;
      if (pending.length > 0) {
        saveTrials(pending).catch(e => console.error('ブロックデータ保存エラー:', e));
      }
    },
  };
}

// 練習試行
timeline.push(...buildSartBlock(jsPsych, () => participantId, () => participantCode, condition, 0, 'practice', collectedTrials));
timeline.push(buildPracticeResultTrial(collectedTrials));
timeline.push(buildBlockSaveTrial());

// 本試行（3ブロック）
for (let block = 1; block <= EXPERIMENT_CONFIG.NUM_BLOCKS; block++) {
  timeline.push(buildBlockStartTrial(block));
  timeline.push(...buildSartBlock(jsPsych, () => participantId, () => participantCode, condition, block, 'test', collectedTrials));
  timeline.push(buildBlockSaveTrial());
  if (block < EXPERIMENT_CONFIG.NUM_BLOCKS) {
    timeline.push(buildBreakTrial(block));
  }
}

// アンケート
timeline.push(buildImiTrial(() => participantId, () => participantCode, collectedResponses));
timeline.push(buildNasaTlxTrial(() => participantId, () => participantCode, collectedResponses));

// 最終保存（終了画面の直前・fire-and-forget）
// 試行データはブロックごとに保存済み。ここでは未保存分の念のためのフラッシュと、
// アンケート保存・完了マークを行う。
timeline.push({
  type: htmlKeyboardResponse,
  stimulus: '',
  choices: 'NO_KEYS',
  trial_duration: 0,
  on_finish: () => {
    const pending = collectedTrials.slice(savedTrialCount);
    savedTrialCount = collectedTrials.length;
    Promise.resolve()
      .then(() => (pending.length > 0 ? saveTrials(pending) : undefined))
      .then(() => saveQuestionnaire(collectedResponses))
      .then(() => markCompleted(participantId))
      .catch(e => console.error('データ保存エラー:', e));
  },
});

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
      <p>ご不明な点は以下までご連絡ください。<br>E-mail: s2331104LJ@s.chibakoudai.jp</p>
    </div>
  `,
  choices: [],
  trial_duration: null,
});

// 実験開始
jsPsych.run(timeline);
