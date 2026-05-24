import { Keyboard } from 'grammy';
import { bot } from '../bot';

export const mainMenuKeyboard = new Keyboard()
  .text('Профиль', 'primary')
  .text('Цели', 'success')
  .resized()
  .persistent();

bot.command('menu', async (ctx) => {
  await ctx.reply('Главное меню:', { reply_markup: mainMenuKeyboard });
});
