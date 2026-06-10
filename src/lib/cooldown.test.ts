import { getDailyCooldownRemaining } from './cooldown';

describe('getDailyCooldownRemaining', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-10T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('возвращает null, если задача ещё не выполнялась', () => {
    expect(getDailyCooldownRemaining(null)).toBeNull();
  });

  it('возвращает null, если кулдаун в 12 часов истёк', () => {
    const completedAt = new Date('2026-06-09T23:00:00Z');
    expect(getDailyCooldownRemaining(completedAt)).toBeNull();
  });

  it('возвращает оставшееся время, если кулдаун ещё активен', () => {
    const completedAt = new Date('2026-06-10T11:00:00Z');
    expect(getDailyCooldownRemaining(completedAt)).toBe('11ч 0м');
  });

  it('учитывает минуты в остатке кулдауна', () => {
    const completedAt = new Date('2026-06-10T11:30:00Z');
    expect(getDailyCooldownRemaining(completedAt)).toBe('11ч 30м');
  });
});
