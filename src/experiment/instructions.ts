import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import type { Condition } from '../types';

const MASK_SVG = `<svg class="mask-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" stroke="black" stroke-width="6" fill="none"/>
  <line x1="15" y1="15" x2="85" y2="85" stroke="black" stroke-width="6"/>
  <line x1="85" y1="15" x2="15" y2="85" stroke="black" stroke-width="6"/>
</svg>`;

export function buildInstructionTrials(condition: Condition) {
  const page1 = {
    type: htmlButtonResponse,
    css_classes: 'trial-consent',
    stimulus: `
      <div class="consent-container">
        <h2>課題の説明</h2>
        <div class="consent-body">
          <p class="instr-intro">
            この実験では、画面中央に <strong>1〜9 の数字</strong> が次々と表示されます。<br>
            数字を見て、以下のルールに従ってできるだけ <strong>速く・正確に</strong> 反応してください。
          </p>
          <div class="instruction-rule">
            <div class="rule-box rule-go">
              <div class="rule-digit">5</div>
              <p class="rule-desc">「3」<strong>以外</strong>の数字が出たとき</p>
              <p class="rule-action"><kbd>スペースキー</kbd> を押す</p>
            </div>
            <div class="rule-box rule-nogo">
              <div class="rule-digit target">3</div>
              <p class="rule-desc">「3」が出たとき</p>
              <p class="rule-action"><strong>何も押さない</strong></p>
            </div>
          </div>
          <div class="consent-sections">
            <section class="consent-section">
              <h3>大切なポイント</h3>
              <p>数字は約 <strong>0.25 秒</strong> しか表示されません。常に画面の中心を見続け、いつでも反応できるよう集中してください。</p>
            </section>
            <section class="consent-section">
              <h3>よくある間違い</h3>
              <p>「3」が出たときに思わずキーを押してしまう（抑制できない）ことが最もよくある誤りです。「3」が見えたら <strong>意識的に手を止めて</strong> ください。</p>
            </section>
          </div>
        </div>
      </div>
    `,
    choices: ['次へ'],
  };

  const page2 = {
    type: htmlButtonResponse,
    css_classes: 'trial-consent',
    stimulus: `
      <div class="consent-container">
        <h2>1回の試行の流れ</h2>
        <div class="consent-body">
          <p class="instr-intro">各試行は以下の 3 つの場面で構成されており、これが繰り返されます。</p>
          <div class="trial-flow">
            <div class="flow-item">
              <div class="flow-stimulus fixation">+</div>
              <div class="flow-label">注視点<br><span>500ms</span></div>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-item">
              <div class="flow-stimulus digit">5</div>
              <div class="flow-label">数字<br><span>250ms</span></div>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-item">
              <div class="flow-stimulus mask">${MASK_SVG}</div>
              <div class="flow-label">マスク<br><span>900ms</span></div>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-item">
              <div class="flow-label">繰り返し</div>
            </div>
          </div>
          <div class="consent-sections">
            <section class="consent-section">
              <h3>① 注視点（＋）　500ms</h3>
              <p>画面中央に「＋」が表示されます。次の数字に備えて、視線を画面の中心に合わせてください。</p>
            </section>
            <section class="consent-section">
              <h3>② 数字　250ms（約 0.25 秒）</h3>
              <p>数字が一瞬だけ表示されます。非常に短い時間なので、素早く判断してください。<strong>この画面が表示されている間に反応できます。</strong></p>
            </section>
            <section class="consent-section">
              <h3>③ マスク（☓マーク）　900ms</h3>
              <p>数字の直後に☓マークが表示されます。<strong>マスクが表示されている間も引き続き反応できます。</strong>マスクが消えると次の試行に移ります。</p>
            </section>
          </div>
        </div>
      </div>
    `,
    choices: ['次へ'],
  };

  const page3Condition = condition === 'B' ? {
    type: htmlButtonResponse,
    css_classes: 'trial-consent',
    stimulus: `
      <div class="consent-container">
        <h2>ポイントシステムについて</h2>
        <div class="consent-body">
          <p class="instr-intro">
            正しく反応するたびにポイントが加算されます。<br>
            できるだけ多くのポイントを獲得することを目指してください！
          </p>
          <div class="consent-sections">
            <section class="consent-section">
              <h3><span class="badge badge-fast">Fast</span>　反応時間が 400ms 未満</h3>
              <p>非常に素早く反応できた場合に表示されます。<strong>+10 ポイント</strong></p>
            </section>
            <section class="consent-section">
              <h3><span class="badge badge-good">Good</span>　反応時間が 400〜700ms</h3>
              <p>速すぎず遅すぎない、安定した反応ができた場合に表示されます。<strong>+10 ポイント</strong></p>
            </section>
            <section class="consent-section">
              <h3><span class="badge badge-slow">Slow</span>　反応時間が 700ms 超</h3>
              <p>反応はできているものの、やや遅れた場合に表示されます。<strong>+10 ポイント</strong></p>
            </section>
            <section class="consent-section">
              <h3><span class="badge badge-inhibit">✓ 抑制成功</span>　「3」を正しく抑制</h3>
              <p>「3」が出たときにキーを押さずに我慢できた場合に表示されます。<strong>+10 ポイント</strong></p>
            </section>
          </div>
          <div class="instr-callout">
            ❌ 誤反応（「3」でキーを押す・「3」以外で押さない）はポイントになりません。<br>
            画面上部のバーに現在の得点と進捗が常に表示されます。
          </div>
        </div>
      </div>
    `,
    choices: ['次へ'],
  } : null;

  const practiceStart = {
    type: htmlButtonResponse,
    css_classes: 'trial-consent',
    stimulus: `
      <div class="consent-container">
        <h2>練習試行について</h2>
        <div class="consent-body">
          <p class="instr-intro">
            本番の前に、まず <strong>18 回</strong> の練習試行を行います。<br>
            練習中は間違えても問題ありません。課題の感覚をつかんでください。
          </p>
          <div class="consent-sections">
            <section class="consent-section">
              <h3>練習の内容</h3>
              <p>本番と同じ条件（数字の種類・表示時間・操作方法）で行います。ルールを思い出しながら進めてください。</p>
            </section>
            <section class="consent-section">
              <h3>練習終了後</h3>
              <p>18 回が終わると正答数が表示されます。確認してから本番に進んでください。</p>
            </section>
          </div>
          <div class="instr-callout">
            準備ができたら下のボタンを押して練習を開始してください。
          </div>
        </div>
      </div>
    `,
    choices: ['練習を開始する'],
  };

  const trials = [page1, page2];
  if (page3Condition) trials.push(page3Condition);
  trials.push(practiceStart);
  return trials;
}
