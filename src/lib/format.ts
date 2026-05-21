/** Отступ для второй строки прогресса цели */
export const GOAL_XP_LINE_INDENT = '      ';

export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function buildProgressBar(percent: number): string {
  const filled = Math.min(10, Math.max(0, Math.floor(percent / 10)));
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

export function formatGoalProgress(currentXp: number, requiredXp: number): string {
  const percent = requiredXp > 0
    ? Math.min(100, Math.floor((currentXp / requiredXp) * 100))
    : 0;
  return `${buildProgressBar(percent)} ${percent}%`;
}
