import { formatNumber, buildProgressBar, formatGoalProgress } from './format';

describe('formatNumber', () => {
  it('не меняет числа до тысячи', () => {
    expect(formatNumber(999)).toBe('999');
  });

  it('разделяет разряды пробелами', () => {
    expect(formatNumber(1000)).toBe('1 000');
    expect(formatNumber(1234567)).toBe('1 234 567');
  });
});

describe('buildProgressBar', () => {
  it('рисует пустой бар при 0%', () => {
    expect(buildProgressBar(0)).toBe('▱▱▱▱▱▱▱▱▱▱');
  });

  it('рисует полный бар при 100%', () => {
    expect(buildProgressBar(100)).toBe('▰▰▰▰▰▰▰▰▰▰');
  });

  it('заполняет бар пропорционально проценту', () => {
    expect(buildProgressBar(55)).toBe('▰▰▰▰▰▱▱▱▱▱');
  });

  it('ограничивает значения за пределами 0–100', () => {
    expect(buildProgressBar(150)).toBe('▰▰▰▰▰▰▰▰▰▰');
    expect(buildProgressBar(-10)).toBe('▱▱▱▱▱▱▱▱▱▱');
  });
});

describe('formatGoalProgress', () => {
  it('показывает процент выполнения цели', () => {
    expect(formatGoalProgress(50, 100)).toBe('▰▰▰▰▰▱▱▱▱▱ 50%');
  });

  it('возвращает 0% при нулевом требуемом опыте', () => {
    expect(formatGoalProgress(50, 0)).toBe('▱▱▱▱▱▱▱▱▱▱ 0%');
  });

  it('не превышает 100% при переборе опыта', () => {
    expect(formatGoalProgress(200, 100)).toBe('▰▰▰▰▰▰▰▰▰▰ 100%');
  });
});
