const COOLDOWN_MS = 12 * 60 * 60 * 1000;

export function getDailyCooldownRemaining(completedAt: Date | null): string | null {
  if (!completedAt) return null;
  const now = new Date();
  const elapsed = now.getTime() - new Date(completedAt).getTime();
  if (elapsed >= COOLDOWN_MS) return null;
  const remaining = COOLDOWN_MS - elapsed;
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}ч ${minutes}м`;
}
