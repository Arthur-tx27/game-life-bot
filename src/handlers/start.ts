import { bot } from '../bot';
import { findOrCreateUser } from '../services/user';
import {
  getActualAvatarPath,
  getLevel,
  getLevelProgress,
  getXpToNextLevel,
} from '../services/leveling';
import { mainMenuKeyboard } from './menu';
import { InputFile } from 'grammy';

bot.command('start', async (ctx) => {
  if (!ctx.from || !ctx.chat) return;
  await ctx.deleteMessage().catch(() => {});
  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );

  const name = user.firstName || 'Пользователь';
  const level = getLevel(user.totalXp);
  const progress = getLevelProgress(user.totalXp);
  const xpToNext = getXpToNextLevel(user.totalXp);
  const filled = Math.floor(progress / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  const caption =
    `*${name}*\n` +
    `*${level} lvl* ` +
    `${bar}` +
    ` *${progress}%*\n` +
    `До следующего уровня: ${xpToNext} XP`;

  const actualAvatar = new InputFile(getActualAvatarPath(level));

  const msg = await ctx.replyWithPhoto(actualAvatar, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard,
  });

  await ctx.api
    .pinChatMessage(ctx.chat.id, msg.message_id, {
      disable_notification: true,
    })
    .catch(() => {});
});
