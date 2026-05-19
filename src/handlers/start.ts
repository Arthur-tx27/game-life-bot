import { bot } from '../bot';
import { findOrCreateUser } from '../services/user';

bot.command('start', async (ctx) => {
  if (!ctx.from) return;

  const user = await findOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  await ctx.reply(`Привет, ${user.firstName || 'загадочный ноунейм'}!`);
});
