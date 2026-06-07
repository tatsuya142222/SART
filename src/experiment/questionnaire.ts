import surveyLikert from '@jspsych/plugin-survey-likert';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import { IMI_ITEMS, NASA_TLX_ITEMS } from '../config/experiment';
import type { QuestionnaireResponse } from '../types';

export function buildImiTrial(getParticipantId: () => string, getParticipantCode: () => string, collectedResponses: QuestionnaireResponse[]) {
  return {
    type: surveyLikert,
    questions: IMI_ITEMS.map(item => ({
      prompt: item.text,
      labels: ['1\n全くそう思わない', '2', '3', '4\nどちらでもない', '5', '6', '7\n非常にそう思う'],
      required: true,
    })),
    preamble: '<h2 class="q-title">アンケート（1/2）</h2><p class="q-subtitle">今行った課題についての感想をお聞きします。最もあてはまる数字を選んでください。</p>',
    button_label: '次へ',
    on_finish: (data: any) => {
      const responses = data.response as Record<string, number>;
      IMI_ITEMS.forEach((item, idx) => {
        const rawScore = responses[`Q${idx}`] + 1; // jsPsych returns 0-indexed
        const score = item.reversed ? 8 - rawScore : rawScore;
        collectedResponses.push({
          participant_id: getParticipantId(),
          participant_code: getParticipantCode(),
          questionnaire_type: 'IMI',
          item_code: item.code,
          score,
        });
      });
    },
  };
}

export function buildNasaTlxTrial(getParticipantId: () => string, getParticipantCode: () => string, collectedResponses: QuestionnaireResponse[]) {
  const sliderHtml = NASA_TLX_ITEMS.map(item => `
    <div class="nasa-item">
      <div class="nasa-label">${item.label}</div>
      <div class="nasa-desc">${item.description}</div>
      <div class="nasa-slider-row">
        <span class="nasa-anchor">${item.low_label}</span>
        <input type="range" id="nasa-${item.code}" min="0" max="100" value="50" class="nasa-slider">
        <span class="nasa-anchor">${item.high_label}</span>
        <span class="nasa-value" id="val-${item.code}">50</span>
      </div>
    </div>
  `).join('');

  return {
    type: htmlButtonResponse,
    stimulus: `
      <div class="nasa-container">
        <h2 class="q-title">アンケート（2/2）</h2>
        <p class="q-subtitle">課題中の負担感について、スライダーを動かして回答してください。</p>
        ${sliderHtml}
      </div>
    `,
    choices: ['回答を送信する'],
    on_load: () => {
      NASA_TLX_ITEMS.forEach(item => {
        const slider = document.getElementById(`nasa-${item.code}`) as HTMLInputElement;
        const valEl = document.getElementById(`val-${item.code}`);
        slider?.addEventListener('input', () => {
          if (valEl) valEl.textContent = slider.value;
        });
      });
    },
    on_finish: () => {
      NASA_TLX_ITEMS.forEach(item => {
        const slider = document.getElementById(`nasa-${item.code}`) as HTMLInputElement;
        const score = slider ? parseInt(slider.value, 10) : 50;
        collectedResponses.push({
          participant_id: getParticipantId(),
          participant_code: getParticipantCode(),
          questionnaire_type: 'NASA-TLX',
          item_code: item.code,
          score,
        });
      });
    },
  };
}
