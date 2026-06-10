import './config';
import './handlers';
import { GrammyError, HttpError } from 'grammy';
import { bot } from './bot';
import { prisma } from './lib/prisma';

bot.catch((botError) => {
  console.error(`Ошибка при обработке апдейта ${botError.ctx.update.update_id}:`);

  const { error } = botError;
  if (error instanceof GrammyError) {
    console.error('Ошибка Telegram API:', error.description);
  } else if (error instanceof HttpError) {
    console.error('Сетевая ошибка:', error);
  } else {
    console.error('Неизвестная ошибка:', error);
  }
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`Получен ${signal}, останавливаю бота...`);
  await bot.stop();
  await prisma.$disconnect();
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

bot
  .start({
    onStart: (botInfo) => console.log(`Бот @${botInfo.username} запущен`),
  })
  .catch((error) => {
    console.error('Бот аварийно остановлен:', error);
    process.exit(1);
  });
