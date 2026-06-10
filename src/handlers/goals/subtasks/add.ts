import { Context } from 'grammy';
import { bot } from '../../../bot';
import { createSubtask } from '../../../services/goal';
import { formatNumber } from '../../../lib/format';
import { parsePositiveInt } from '../../../lib/parse';
import { startDialog, DialogStep } from '../../../lib/dialogs';
import { renderGoalView } from '../view';

const TYPE_LABELS: Record<string, string> = {
  DAILY: 'ежедневную',
  MEDIUM: 'среднюю',
  HARD: 'сложную',
};

interface SubtaskDraft {
  goalId: number;
  type: 'DAILY' | 'MEDIUM' | 'HARD';
  title: string;
  xpReward: number;
}

export async function startAddSubtask(
  ctx: Context,
  goalId: number,
  type: 'DAILY' | 'MEDIUM' | 'HARD',
) {
  if (!ctx.from || !ctx.chat) return;

  const typeLabel = TYPE_LABELS[type] || type;

  const draft: SubtaskDraft = {
    goalId,
    type,
    title: '',
    xpReward: 0,
  };

  const steps: DialogStep[] = [
    {
      prompt: 'Введите название задачи:',
      handler: async (chatId, text) => {
        if (!text.trim()) {
          await bot.api.sendMessage(chatId, 'Название не может быть пустым');
          return 'retry';
        }
        draft.title = text.trim();
        return 'next';
      },
    },
    {
      prompt: 'Введите кол-во XP за выполнение:',
      handler: async (chatId, text) => {
        const xp = parsePositiveInt(text);
        if (xp === null) {
          await bot.api.sendMessage(chatId, 'Введите положительное целое число');
          return 'retry';
        }
        draft.xpReward = xp;
        await saveSubtask(chatId, draft);
        return 'done';
      },
    },
  ];

  await ctx.reply(`🔧 **Создание задачи** (${typeLabel})`, {
    parse_mode: 'Markdown',
  });
  await startDialog(ctx.chat.id, steps);
}

async function saveSubtask(chatId: number, draft: SubtaskDraft): Promise<void> {
  const subtask = await createSubtask({
    goalId: draft.goalId,
    title: draft.title,
    type: draft.type,
    xpReward: draft.xpReward,
  });

  await bot.api.sendMessage(
    chatId,
    `✅ Задача "${subtask.title}" добавлена!\n` +
      `⭐ Награда: +${formatNumber(subtask.xpReward)} XP`,
  );

  const view = await renderGoalView(draft.goalId);
  if (view) {
    await bot.api.sendMessage(chatId, view.text, {
      reply_markup: view.keyboard,
    });
  }
}
