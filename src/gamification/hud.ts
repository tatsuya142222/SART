import type { GamificationState } from './state';

export function mountHud(): void {
  if (document.getElementById('sart-hud')) return;

  const el = document.createElement('div');
  el.id = 'sart-hud';
  el.innerHTML = `
    <div id="hud-combo-label">COMBO</div>
    <div id="hud-combo-count">0</div>
  `;
  document.body.appendChild(el);
}

export function unmountHud(): void {
  document.getElementById('sart-hud')?.remove();
}

export function updateHud(state: GamificationState): void {
  const countEl = document.getElementById('hud-combo-count');
  if (!countEl) return;

  countEl.textContent = String(state.streak);

  if (state.streak > 0) {
    countEl.classList.remove('hud-combo-bump');
    void countEl.offsetWidth; // アニメーション再起動のためのリフロー
    countEl.classList.add('hud-combo-bump');
  } else {
    countEl.classList.remove('hud-combo-bump');
  }
}
