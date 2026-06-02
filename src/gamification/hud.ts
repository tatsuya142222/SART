import type { GamificationState } from './state';

let hudElement: HTMLElement | null = null;

export function mountHud(): void {
  if (document.getElementById('sart-hud')) return;

  hudElement = document.createElement('div');
  hudElement.id = 'sart-hud';
  hudElement.innerHTML = `
    <div id="hud-points">★ <span id="hud-points-value">0</span> pts</div>
    <div id="hud-progress-wrapper">
      <div id="hud-progress-bar"></div>
    </div>
    <div id="hud-progress-label"><span id="hud-trial-current">0</span> / <span id="hud-trial-total">0</span></div>
  `;
  document.body.appendChild(hudElement);
}

export function unmountHud(): void {
  document.getElementById('sart-hud')?.remove();
  hudElement = null;
}

export function updateHud(state: GamificationState): void {
  const pointsEl = document.getElementById('hud-points-value');
  const barEl = document.getElementById('hud-progress-bar');
  const currentEl = document.getElementById('hud-trial-current');
  const totalEl = document.getElementById('hud-trial-total');

  if (!pointsEl || !barEl || !currentEl || !totalEl) return;

  pointsEl.textContent = state.points.toLocaleString();
  const pct = state.trialsPerBlock > 0
    ? (state.currentTrialInBlock / state.trialsPerBlock) * 100
    : 0;
  barEl.style.width = `${pct}%`;
  currentEl.textContent = String(state.currentTrialInBlock);
  totalEl.textContent = String(state.trialsPerBlock);
}
