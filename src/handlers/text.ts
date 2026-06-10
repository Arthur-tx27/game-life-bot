import { bot } from '../bot';
import { isInDialog, cancelDialog, handleDialogInput } from '../lib/dialogs';
import { showGoalsList } from './goals/list';
import { showProfile } from './profile';
import { MENU_BUTTONS } from './menu';

const menuLabels: readonly string[] = Object.values(MENU_BUTTONS);

bot.use(async (ctx, next) => {
  if (!ctx.chat) return;

  const text = ctx.message?.text;
  if (!text) return await next();

  // Команды и кнопки меню → отмена диалога + передача дальше
  if (text.startsWith('/') || menuLabels.includes(text)) {
    if (isInDialog(ctx.chat.id)) {
      cancelDialog(ctx.chat.id);
      await ctx.reply('❌ Создание цели отменено');
    }
    return await next();
  }

  // Обычный текст → попробовать обработать как шаг диалога
  const handled = await handleDialogInput(ctx.chat.id, text);
  if (handled) return;

  await next();
});

bot.hears(MENU_BUTTONS.profile, async (ctx) => {
  await ctx.deleteMessage().catch(() => {});
  await showProfile(ctx);
});

bot.hears(MENU_BUTTONS.goals, async (ctx) => {
  await ctx.deleteMessage().catch(() => {});
  await showGoalsList(ctx);
});
