import { bot } from '../bot';
import { findOrCreateUser } from '../services/user';
import { getProfileCard } from '../services/profile';
import { sendPinnedProfileCard } from './profile';

bot.command('start', async (ctx) => {
  if (!ctx.from || !ctx.chat) return;
  await ctx.deleteMessage().catch(() => {});

  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );

  const card = getProfileCard(user.totalXp, user.firstName);
  await sendPinnedProfileCard(ctx, card);
});
