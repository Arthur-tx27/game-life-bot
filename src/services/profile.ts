import { InputFile } from 'grammy';
import { formatNumber, buildProgressBar } from '../lib/format';
import {
  getActualAvatarPath,
  getLevel,
  getLevelProgress,
  getXpToNextLevel,
} from './leveling';

export interface ProfileCard {
  name: string;
  level: number;
  progress: number;
  xpToNext: number;
  bar: string;
  avatar: InputFile;
}

export function getProfileCard(
  totalXp: number,
  firstName: string | null ,
): ProfileCard {
  const name = firstName || 'Пользователь';
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const xpToNext = getXpToNextLevel(totalXp);
  const bar = buildProgressBar(progress);
  const avatar = new InputFile(getActualAvatarPath(level));

  return { name, level, progress, xpToNext, bar, avatar };
}

export function buildProfileCaption(
  card: ProfileCard,
  extra?: string,
): string {
  const base =
    `*${card.name}*\n` +
    `*${card.level} lvl* ` +
    `${card.bar} ` +
    `*${card.progress}%*\n` +
    `До следующего уровня: ${formatNumber(card.xpToNext)} XP`;
  return extra ? base + extra : base;
}
