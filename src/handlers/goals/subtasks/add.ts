import { bot } from '../../../bot';
import { createSubtask } from '../../../services/goal';
import { formatNumber } from '../../../lib/format';
import { startDialog, DialogState } from '../../../lib/dialogs';
import { renderGoalView } from '../view';

const TYPE_LABELS: Record<string, string> = {
  DAILY: 'ежедневную',
  MEDIUM: 'среднюю',
  HARD: 'сложную',
};

export async function startAddSubtask(
  ctx: any,
  goalId: number,
  type: 'DAILY' | 'MEDIUM' | 'HARD',
) {
  if (!ctx.from || !ctx.chat) return;

  const typeLabel = TYPE_LABELS[type] || type;

  const data: Record<string, unknown> = {
    goalId,
    type,
    title: '',
    xpReward: 0,
  };

  const steps: DialogState['steps'] = [
    {
      prompt: 'Введите название задачи:',
      handler: (_chatId, text) => {
        if (!text.trim()) {
          bot.api.sendMessage(_chatId, 'Название не может быть пустым');
          return 'retry';
        }
        data.title = text.trim();
        return 'next';
      },
    },
    {
      prompt: 'Введите кол-во XP за выполнение:',
      handler: async (_chatId, text) => {
        const xp = parseInt(text.trim().replaceAll(" ", ""), 10);
        if (isNaN(xp) || xp <= 0) {
          bot.api.sendMessage(_chatId, 'Введите положительное целое число');
          return 'retry';
        }
        data.xpReward = xp;
        await saveSubtask(_chatId, data);
        return 'done';
      },
    },
  ];

  const state: DialogState = {
    userId: ctx.from.id,
    step: 0,
    data,
    steps,
  };

  await ctx.reply(`🔧 **Создание задачи** (${typeLabel})`, {
    parse_mode: 'Markdown',
  });
  startDialog(ctx.chat.id, state);
}

async function saveSubtask(
  chatId: number,
  data: Record<string, unknown>,
): Promise<void> {
  const goalId = data.goalId as number;
  const type = data.type as 'DAILY' | 'MEDIUM' | 'HARD';

  const subtask = await createSubtask({
    goalId,
    title: data.title as string,
    type,
    xpReward: data.xpReward as number,
  });

  await bot.api.sendMessage(
    chatId,
    `✅ Задача "${subtask.title}" добавлена!\n` +
      `⭐ Награда: +${formatNumber(subtask.xpReward)} XP`,
  );

  const view = await renderGoalView(goalId);
  if (view) {
    await bot.api.sendMessage(chatId, view.text, {
      reply_markup: view.keyboard,
    });
  }
}
