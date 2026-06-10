import { getLevel, getXpForLevel, getXpToNextLevel, getLevelProgress } from './leveling';

describe('getLevel', () => {
  it('возвращает 1 уровень при нулевом и отрицательном опыте', () => {
    expect(getLevel(0)).toBe(1);
    expect(getLevel(-100)).toBe(1);
  });

  it('возвращает 1 уровень, пока не набран порог второго', () => {
    expect(getLevel(999)).toBe(1);
  });

  it('возвращает 2 уровень ровно на пороге в 1000 XP', () => {
    expect(getLevel(1000)).toBe(2);
  });

  it('растёт монотонно с ростом опыта', () => {
    expect(getLevel(10000)).toBeGreaterThan(getLevel(3000));
  });
});

describe('getXpForLevel', () => {
  it('возвращает 0 для первого уровня и ниже', () => {
    expect(getXpForLevel(1)).toBe(0);
    expect(getXpForLevel(0)).toBe(0);
  });

  it('возвращает 1000 XP для второго уровня', () => {
    expect(getXpForLevel(2)).toBe(1000);
  });

  it('согласован с getLevel: порог уровня даёт этот уровень', () => {
    for (const level of [2, 3, 5, 9]) {
      expect(getLevel(getXpForLevel(level) + 1)).toBe(level);
    }
  });
});

describe('getXpToNextLevel', () => {
  it('с нуля до второго уровня нужно 1000 XP', () => {
    expect(getXpToNextLevel(0)).toBe(1000);
  });

  it('уменьшается по мере набора опыта внутри уровня', () => {
    expect(getXpToNextLevel(500)).toBe(500);
  });
});

describe('getLevelProgress', () => {
  it('возвращает 0% в начале уровня', () => {
    expect(getLevelProgress(0)).toBe(0);
  });

  it('возвращает 50% на середине уровня', () => {
    expect(getLevelProgress(500)).toBe(50);
  });

  it('не превышает 100%', () => {
    expect(getLevelProgress(999)).toBeLessThanOrEqual(100);
  });
});
