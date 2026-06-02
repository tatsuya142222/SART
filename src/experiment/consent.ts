import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import type { Condition } from '../types';
import { createParticipant, saveConsentForm } from '../supabase/save';

const CONSENT_ITEMS = [
  '研究目的・研究方法',
  '参加条件（視力0.8以上、18歳以上等）',
  'いつでも実験の中断や参加の同意を撤回できること',
  '個人情報の保護',
  '特定の個人を識別できない状態で測定データが公的データベースで公開される可能性があること',
  '謝礼・交通費',
  '知的財産の権利が自分にないこと',
  'その他について',
];

export function buildConsentTrial() {
  return {
    type: htmlButtonResponse,
    css_classes: 'trial-consent',
    stimulus: `
      <div class="consent-container">
        <h2>実験説明書</h2>
        <p class="consent-pi">研究責任者：千葉工業大学 情報変革科学部 認知情報科学科 助教 樋口 洋子</p>
        <div class="consent-body">
          <p class="consent-lead">次ページの同意書署名の前に、以下をご確認ください</p>
          <div class="consent-sections">
            <section class="consent-section">
              <h3>研究の目的・方法</h3>
              <p>本研究は、継続的な注意課題を行います。実験時間は休憩を含め一時間程度です。</p>
            </section>
            <section class="consent-section">
              <h3>参加条件</h3>
              <p>18歳以上であり、視力（矯正含む）が0.8以上であることが条件です。</p>
            </section>
            <section class="consent-section">
              <h3>自由意思と中断</h3>
              <p>参加は任意です。実験中いつでも不利益なく中断・同意撤回が可能です。</p>
            </section>
            <section class="consent-section">
              <h3>個人情報の保護とデータ公開</h3>
              <p>個人情報は厳重に管理されます。実験データは個人が特定されない統計データとして処理され、学会発表や公的データベース（Open Science Framework等）で公開される可能性があります。</p>
            </section>
            <section class="consent-section">
              <h3>謝礼・交通費・権利</h3>
              <p>謝礼の支払いは規定に従います。交通費の支給はございません。本実験で得られたデータの知的財産権は参加者には帰属しません。</p>
            </section>
            <section class="consent-section">
              <h3>問い合わせ先</h3>
              <p>ご不明な点がございましたら、以下までご連絡ください。<br>
              千葉工業大学 情報科学部 E-mail: s2331104lj@s.chibakoudai.jp</p>
            </section>
          </div>
          <div class="consent-download">
            <p class="consent-download-note">※より詳細な手順や連絡先については、下のボタンから説明書をダウンロードしてご確認ください。</p>
            <a class="consent-download-btn" href="/explanation.pdf" download>
              📄 詳細説明書をダウンロード
            </a>
          </div>
        </div>
      </div>
    `,
    choices: ['次へ'],
  };
}

export function buildConsentFormTrial(
  condition: Condition,
  onCreated: (participantId: string, code: string) => void,
) {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric',
  });

  let captured = { furigana: '', age: 0, gender: '', signature: '', email: '' };

  return {
    type: htmlButtonResponse,
    css_classes: 'trial-consent',
    stimulus: `
      <div class="consent-container">
        <h2>研究参加同意書</h2>
        <div class="consent-body">
          <div class="cf-addressee">
            千葉工業大学 情報変革科学部 認知情報科学科<br>
            助教 樋口　洋子 殿
          </div>
          <p class="cf-intro">私は以下の項目について確認し、本研究の参加に同意します。</p>
          <div class="cf-items">
            ${CONSENT_ITEMS.map((item, i) => `
              <label class="cf-item-label">
                <input type="checkbox" class="cf-item" data-idx="${i}">
                <span>${item}</span>
              </label>
            `).join('')}
          </div>
          <div class="cf-fields">
            <div class="cf-field-row">
              <label class="cf-field-label">フリガナ（必須）</label>
              <input type="text" id="cf-furigana" class="cf-input" placeholder="ヤマダ タロウ">
            </div>
            <div class="cf-field-row">
              <label class="cf-field-label">年齢（必須）</label>
              <div class="cf-field-inline">
                <input type="number" id="cf-age" class="cf-input cf-input-sm" min="18" max="99" placeholder="22">
                <span>歳</span>
              </div>
            </div>
            <div class="cf-field-row">
              <label class="cf-field-label">性別（必須）</label>
              <select id="cf-gender" class="cf-input cf-select">
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
                <option value="no_answer">回答しない</option>
              </select>
            </div>
            <div class="cf-field-row">
              <label class="cf-field-label">署名（必須：お名前を入力してください）</label>
              <input type="text" id="cf-signature" class="cf-input" placeholder="山田 太郎">
            </div>
            <div class="cf-field-row">
              <label class="cf-field-label">Email（必須）</label>
              <input type="email" id="cf-email" class="cf-input" placeholder="example@email.com">
            </div>
            <div class="cf-field-row cf-field-date-row">
              <span class="cf-field-label">署名日</span>
              <span class="cf-date">${today}</span>
            </div>
          </div>
        </div>
      </div>
    `,
    choices: ['次へ'],
    button_html: (choice: string) =>
      `<button class="jspsych-btn" id="cf-submit-btn" disabled>${choice}</button>`,
    on_load: () => {
      const btn = document.getElementById('cf-submit-btn') as HTMLButtonElement;

      function validate() {
        const allChecked = Array.from(
          document.querySelectorAll<HTMLInputElement>('.cf-item'),
        ).every(cb => cb.checked);
        const furigana = (document.getElementById('cf-furigana') as HTMLInputElement).value.trim();
        const age = parseInt((document.getElementById('cf-age') as HTMLInputElement).value, 10);
        const gender = (document.getElementById('cf-gender') as HTMLSelectElement).value;
        const signature = (document.getElementById('cf-signature') as HTMLInputElement).value.trim();
        const email = (document.getElementById('cf-email') as HTMLInputElement).value.trim();
        const emailOk = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);

        btn.disabled = !(allChecked && furigana && age >= 18 && gender && signature && emailOk);
      }

      document
        .querySelectorAll('.cf-item, #cf-furigana, #cf-age, #cf-gender, #cf-signature, #cf-email')
        .forEach(el => el.addEventListener('input', validate));
      document
        .querySelectorAll('.cf-item')
        .forEach(el => el.addEventListener('change', validate));

      // jsPsych が DOM を消す前に値を退避（capture フェーズで先に実行）
      btn.addEventListener('click', () => {
        captured = {
          furigana: (document.getElementById('cf-furigana') as HTMLInputElement).value.trim(),
          age: parseInt((document.getElementById('cf-age') as HTMLInputElement).value, 10),
          gender: (document.getElementById('cf-gender') as HTMLSelectElement).value,
          signature: (document.getElementById('cf-signature') as HTMLInputElement).value.trim(),
          email: (document.getElementById('cf-email') as HTMLInputElement).value.trim(),
        };
      }, { capture: true });
    },
    on_finish: async () => {
      const { furigana, age, gender, signature, email } = captured;

      const code = `${condition}-${String(Math.floor(Math.random() * 900) + 100)}`;

      try {
        const participantId = await createParticipant({
          participant_code: code,
          condition,
          age,
          gender,
          consent_given: true,
        });
        await saveConsentForm({
          participant_id: participantId,
          furigana,
          signature,
          email,
          signed_at: new Date().toISOString(),
        });
        onCreated(participantId, code);
      } catch (e) {
        console.error('同意書保存エラー:', e);
      }
    },
  };
}

export function buildWithdrawalInfoTrial() {
  return {
    type: htmlButtonResponse,
    css_classes: ['trial-consent'],
    stimulus: `
      <div class="consent-container">
        <h2>実験の中断・同意の撤回について</h2>
        <div class="consent-body">
          <div class="consent-sections">
            <section class="consent-section">
              <h3>実験の中断</h3>
              <p>実験への参加は任意です。いつでも参加を中断できます。中断や同意撤回によって不利な扱いを受けることはありません。</p>
            </section>
            <section class="consent-section">
              <h3>同意の撤回</h3>
              <p>実験途中や実験後であっても同意を撤回することができます。撤回の意思が示されたときは、学会等の発表前であれば計測データ等は破棄します。</p>
            </section>
            <section class="consent-section">
              <h3>お問い合わせ先</h3>
              <p>実験結果の使用などに同意の撤回をご希望の場合は、下記までご連絡ください。</p>
              <div class="cf-addressee withdrawal-contact">
                <strong>研究責任者：樋口　洋子</strong><br>
                千葉工業大学 情報変革科学部 認知情報科学科<br>
                千葉県習志野市津田沼2-17-1<br>
                電話：047-478-0107<br>
                Email: higuchi.yoko@p.chibakoudai.jp
              </div>
            </section>
          </div>
        </div>
        <p class="consent-proceed-note">内容を確認しましたら、次へボタンを押して実験を開始してください。</p>
      </div>
    `,
    choices: ['次へ'],
  };
}
