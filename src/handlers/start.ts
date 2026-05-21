import { bot } from '../bot';
import { findOrCreateUser } from '../services/user';
import { getProfileCard, buildProfileCaption } from '../services/profile';
import { mainMenuKeyboard } from './menu';

bot.command('start', async (ctx) => {
  if (!ctx.from || !ctx.chat) return;
  await ctx.deleteMessage().catch(() => {});

  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );

  const card = getProfileCard(user.totalXp, user.firstName);
  const caption = buildProfileCaption(card);

  const msg = await ctx.replyWithPhoto(card.avatar, {
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
