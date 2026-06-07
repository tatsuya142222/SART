import type { FeedbackType } from '../types';

const FEEDBACK_CONFIG: Record<NonNullable<FeedbackType>, { label: string; className: string }> = {
  excellent:        { label: 'Excellent!!', className: 'feedback-excellent' },
  fast:             { label: 'Fast!',       className: 'feedback-fast' },
  good:             { label: 'Good!',       className: 'feedback-good' },
  slow:             { label: 'Slow…',       className: 'feedback-slow' },
  correct_inhibit:  { label: '✓',           className: 'feedback-inhibit' },
  commission_error: { label: 'Miss',        className: 'feedback-error' },
  omission_error:   { label: 'Miss',        className: 'feedback-error' },
};

let overlayEl: HTMLElement | null = null;

export function mountOverlay(): void {
  if (document.getElementById('sart-feedback-overlay')) return;
  overlayEl = document.createElement('div');
  overlayEl.id = 'sart-feedback-overlay';
  document.body.appendChild(overlayEl);
}

export function unmountOverlay(): void {
  document.getElementById('sart-feedback-overlay')?.remove();
  overlayEl = null;
}

export function showFeedback(feedback: FeedbackType): void {
  if (!overlayEl || feedback === null) return;

  const cfg = FEEDBACK_CONFIG[feedback];
  overlayEl.textContent = cfg.label;
  overlayEl.className = `feedback-visible ${cfg.className}`;

  overlayEl.addEventListener('animationend', () => {
    if (overlayEl) overlayEl.className = '';
  }, { once: true });
}
