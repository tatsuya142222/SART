import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import type { Condition } from '../types';
import { createParticipant } from '../supabase/save';

export function buildParticipantInfoTrial(
  condition: Condition,
  onCreated: (participantId: string, code: string) => void,
) {
  return {
    type: htmlButtonResponse,
    stimulus: `
      <div class="form-container">
        <h2>参加者情報の入力</h2>
        <div class="form-group">
          <label for="age-input">年齢</label>
          <input type="number" id="age-input" min="18" max="99" placeholder="例: 22">
          <span>歳</span>
        </div>
        <div class="form-group">
          <label>性別</label>
          <div class="radio-group">
            <label><input type="radio" name="gender" value="male"> 男性</label>
            <label><input type="radio" name="gender" value="female"> 女性</label>
            <label><input type="radio" name="gender" value="other"> その他</label>
            <label><input type="radio" name="gender" value="no_answer" checked> 回答しない</label>
          </div>
        </div>
      </div>
    `,
    choices: ['次へ'],
    on_finish: async () => {
      const age = parseInt((document.getElementById('age-input') as HTMLInputElement)?.value ?? '0', 10);
      const genderEl = document.querySelector('input[name="gender"]:checked') as HTMLInputElement;
      const gender = genderEl?.value ?? 'no_answer';

      const code = `${condition}-${String(Math.floor(Math.random() * 900) + 100)}`;

      const participantId = await createParticipant({
        participant_code: code,
        condition,
        age,
        gender,
        consent_given: true,
      });

      onCreated(participantId, code);
    },
  };
}
