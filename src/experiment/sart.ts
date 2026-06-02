import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import type { JsPsych } from 'jspsych';
import { EXPERIMENT_CONFIG } from '../config/experiment';
import type { Condition, TrialData, TrialType } from '../types';
import { calcFeedback, createGamificationState, updatePoints } from '../gamification/state';
import { mountHud, unmountHud, updateHud } from '../gamification/hud';
import { mountOverlay, unmountOverlay, showFeedback } from '../gamification/overlay';

const MASK_SVG = `<svg class="mask-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" stroke="black" stroke-width="6" fill="none"/>
  <line x1="15" y1="15" x2="85" y2="85" stroke="black" stroke-width="6"/>
  <line x1="85" y1="15" x2="15" y2="85" stroke="black" stroke-width="6"/>
</svg>`;

function generateTrialSequence(totalTrials: number, numTargets: number): number[] {
  const nonTargets = Array.from({ length: totalTrials - numTargets }, () => {
    let d: number;
    do { d = Math.floor(Math.random() * 9) + 1; } while (d === EXPERIMENT_CONFIG.TARGET_DIGIT);
    return d;
  });
  const targets = Array(numTargets).fill(EXPERIMENT_CONFIG.TARGET_DIGIT);
  const seq = [...nonTargets, ...targets];
  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return seq;
}

export function buildSartBlock(
  jsPsych: JsPsych,
  getParticipantId: () => string,
  condition: Condition,
  blockNumber: number,
  trialType: TrialType,
  collectedTrials: TrialData[],
) {
  const totalTrials = trialType === 'practice'
    ? EXPERIMENT_CONFIG.PRACTICE_TRIALS
    : EXPERIMENT_CONFIG.TEST_TRIALS_PER_BLOCK;
  const numTargets = trialType === 'practice'
    ? EXPERIMENT_CONFIG.PRACTICE_TARGETS
    : EXPERIMENT_CONFIG.TARGETS_PER_BLOCK;

  const digits = generateTrialSequence(totalTrials, numTargets);
  const gamState = createGamificationState(totalTrials);
  let gamStateRef = gamState;

  const trials: object[] = [];

  if (condition === 'B') {
    trials.push({
      type: htmlKeyboardResponse,
      stimulus: '',
      choices: 'NO_KEYS',
      trial_duration: 0,
      on_start: () => {
        mountHud();
        mountOverlay();
        updateHud(gamStateRef);
      },
    });
  }

  for (let i = 0; i < totalTrials; i++) {
    const digit = digits[i];
    const isTarget = digit === EXPERIMENT_CONFIG.TARGET_DIGIT;
    const fontSize = EXPERIMENT_CONFIG.FONT_SIZES[Math.floor(Math.random() * EXPERIMENT_CONFIG.FONT_SIZES.length)];

    // 注視点
    trials.push({
      type: htmlKeyboardResponse,
      stimulus: '<div class="fixation">+</div>',
      choices: 'NO_KEYS',
      trial_duration: EXPERIMENT_CONFIG.FIXATION_DURATION,
    });

    // 数字刺激
    trials.push({
      type: htmlKeyboardResponse,
      stimulus: `<div class="stimulus-digit" style="font-size:${fontSize}px">${digit}</div>`,
      choices: [' '],
      trial_duration: EXPERIMENT_CONFIG.STIMULUS_DURATION,
      response_ends_trial: false,
    });

    // マスク（反応収集）
    trials.push({
      type: htmlKeyboardResponse,
      stimulus: `<div class="mask-wrapper">${MASK_SVG}</div>`,
      choices: [' '],
      trial_duration: EXPERIMENT_CONFIG.MASK_DURATION,
      response_ends_trial: false,
      on_finish: (data: any) => {
        const stimData = jsPsych.data.get().last(2).values()[0];
        const response = (stimData?.response || data?.response) ? ' ' : null;
        const rt = stimData?.rt ?? data?.rt ?? null;
        const correct = isTarget ? response === null : response !== null;

        const trialRecord: TrialData = {
          participant_id: getParticipantId(),
          block_number: blockNumber,
          trial_index: i,
          trial_type: trialType,
          stimulus_digit: digit,
          font_size: fontSize,
          is_target: isTarget,
          response,
          rt,
          correct,
          timestamp: Math.round(performance.now()),
        };
        collectedTrials.push(trialRecord);

        if (condition === 'B') {
          const feedback = calcFeedback(isTarget, response, rt);
          gamStateRef = updatePoints(gamStateRef, feedback);
          updateHud(gamStateRef);
          showFeedback(feedback);
        }
      },
    });
  }

  if (condition === 'B') {
    trials.push({
      type: htmlKeyboardResponse,
      stimulus: '',
      choices: 'NO_KEYS',
      trial_duration: 0,
      on_start: () => {
        unmountHud();
        unmountOverlay();
      },
    });
  }

  return trials;
}

export function buildBreakTrial(blockNumber: number) {
  return {
    type: htmlButtonResponse,
    stimulus: () => {
      let seconds = EXPERIMENT_CONFIG.BREAK_DURATION_SECONDS;
      const container = `
        <div class="break-container">
          <h2>休憩</h2>
          <p>ブロック ${blockNumber} / ${EXPERIMENT_CONFIG.NUM_BLOCKS} 終了</p>
          <p class="break-timer" id="break-countdown">${formatTime(seconds)}</p>
          <p class="break-note">5分後に自動で次へ進みます</p>
        </div>
      `;
      setTimeout(() => {
        const timer = setInterval(() => {
          seconds--;
          const el = document.getElementById('break-countdown');
          if (el) el.textContent = formatTime(seconds);
          if (seconds <= 0) clearInterval(timer);
        }, 1000);
      }, 100);
      return container;
    },
    choices: ['今すぐ次のブロックを開始する'],
    trial_duration: EXPERIMENT_CONFIG.BREAK_DURATION_SECONDS * 1000,
  };
}

export function buildPracticeResultTrial(collectedTrials: TrialData[]) {
  return {
    type: htmlButtonResponse,
    stimulus: () => {
      const practiceData = collectedTrials.filter(d => d.trial_type === 'practice');
      const correct = practiceData.filter(d => d.correct).length;
      const total = practiceData.length;
      return `
        <div class="instruction-container">
          <h2>練習終了</h2>
          <p>正答数：<strong>${correct} / ${total}</strong></p>
          <p>これから本試行を開始します。<br>全部で3ブロック（約30分）です。</p>
          <p>準備ができたらボタンを押してください。</p>
        </div>
      `;
    },
    choices: ['本試行を開始する'],
  };
}

export function buildBlockStartTrial(blockNumber: number) {
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="instruction-container">
        <h2>ブロック ${blockNumber} / ${EXPERIMENT_CONFIG.NUM_BLOCKS}</h2>
        <p>準備ができたら<kbd>スペースキー</kbd>を押して開始してください。</p>
      </div>
    `,
    choices: [' '],
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
