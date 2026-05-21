import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE_XP = 100;
const SCALE = 1.5;

export function getLevel(totalXp: number): number {
  if (totalXp < 0) return 1;
  return Math.floor(Math.pow(totalXp / BASE_XP, 1 / SCALE)) + 1;
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP * Math.pow(level - 1, SCALE));
}

export function getXpToNextLevel(totalXp: number): number {
  const level = getLevel(totalXp);
  return getXpForLevel(level + 1) - totalXp;
}

export function getLevelProgress(totalXp: number): number {
  const level = getLevel(totalXp);
  const current = getXpForLevel(level);
  const next = getXpForLevel(level + 1);
  if (next <= current) return 100;
  return Math.floor(((totalXp - current) / (next - current)) * 100);
}

export function getActualAvatarPath(level: number) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const IMG_DIR = path.resolve(__dirname, '../../img/level-references');
  return path.join(IMG_DIR, `image_part_${level}.png`);
}
