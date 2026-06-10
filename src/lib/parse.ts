/** Парсит положительное целое число; пробелы-разделители разрядов допустимы */
export function parsePositiveInt(text: string): number | null {
  const parsed = parseInt(text.trim().replaceAll(' ', ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}
