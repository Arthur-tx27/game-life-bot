import { bot } from '../bot';
import { showGoalsList } from './goals/list';
import { showProfile } from './profile';

bot.hears('Профиль', async (ctx) => {
  await ctx.deleteMessage().catch(() => {});
  await showProfile(ctx);
});

bot.hears('Цели', async (ctx) => {
  await ctx.deleteMessage().catch(() => {});
  await showGoalsList(ctx);
});
