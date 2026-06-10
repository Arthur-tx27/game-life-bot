import { Context } from 'grammy';
import { bot } from '../../bot';
import { findOrCreateUser } from '../../services/user';
import { createGoal } from '../../services/goal';
import { formatNumber } from '../../lib/format';
import { parsePositiveInt } from '../../lib/parse';
import { startDialog, DialogStep } from '../../lib/dialogs';

interface GoalDraft {
  userId: number;
  title: string;
  description: string | null;
  requiredXp: number;
}

export async function startAddGoal(ctx: Context) {
  if (!ctx.from || !ctx.chat) return;

  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );

  const draft: GoalDraft = {
    userId: user.id,
    title: '',
    description: null,
    requiredXp: 0,
  };

  const steps: DialogStep[] = [
    {
      prompt: 'Введите название цели:',
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
      prompt: 'Введите описание цели (или отправьте "-", чтобы пропустить):',
      handler: (_chatId, text) => {
        draft.description = text.trim() === '-' ? null : text.trim();
        return 'next';
      },
    },
    {
      prompt:
        'Сколько опыта нужно набрать для завершения цели? (число):\n *Легкая ~5000 XP*\n*Средняя ~10000 XP*\n*Сложная ~20000 XP*',
      handler: async (chatId, text) => {
        const xp = parsePositiveInt(text);
        if (xp === null) {
          await bot.api.sendMessage(chatId, 'Введите положительное число');
          return 'retry';
        }
        draft.requiredXp = xp;
        await saveGoal(chatId, draft);
        return 'done';
      },
    },
  ];

  await ctx.reply('🔧 **Создание новой цели**', { parse_mode: 'Markdown' });
  await startDialog(ctx.chat.id, steps);
}

async function saveGoal(chatId: number, draft: GoalDraft): Promise<void> {
  const goal = await createGoal({
    userId: draft.userId,
    title: draft.title,
    description: draft.description ?? '',
    requiredXp: draft.requiredXp,
  });

  await bot.api.sendMessage(
    chatId,
    `✅ Цель "${goal.title}" создана!\n\n` +
      `📝 Описание: ${goal.description || '—'}\n` +
      `⭐ Требуется опыта: ${formatNumber(goal.requiredXp)} XP`,
  );
}
