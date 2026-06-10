import { Keyboard } from 'grammy';
import { bot } from '../bot';

export const MENU_BUTTONS = {
  profile: 'Профиль',
  goals: 'Цели',
} as const;

export const mainMenuKeyboard = new Keyboard()
  .text(MENU_BUTTONS.profile, 'primary')
  .text(MENU_BUTTONS.goals, 'success')
  .resized()
  .persistent();

bot.command('menu', async (ctx) => {
  await ctx.reply('Главное меню:', { reply_markup: mainMenuKeyboard });
});
