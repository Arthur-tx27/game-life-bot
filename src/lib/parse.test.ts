import { parsePositiveInt } from './parse';

describe('parsePositiveInt', () => {
  it('парсит обычное число', () => {
    expect(parsePositiveInt('42')).toBe(42);
  });

  it('игнорирует пробелы-разделители разрядов и края строки', () => {
    expect(parsePositiveInt(' 5 000 ')).toBe(5000);
  });

  it('возвращает null для нечисловой строки', () => {
    expect(parsePositiveInt('abc')).toBeNull();
  });

  it('возвращает null для нуля и отрицательных чисел', () => {
    expect(parsePositiveInt('0')).toBeNull();
    expect(parsePositiveInt('-5')).toBeNull();
  });
});
