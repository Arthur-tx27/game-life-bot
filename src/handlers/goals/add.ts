import { bot } from '../../bot';
import { findOrCreateUser } from '../../services/user';
import { createGoal } from '../../services/goal';
import { formatNumber } from '../../lib/format';
import { startDialog, DialogState } from '../../lib/dialogs';

export async function startAddGoal(ctx: any) {
  if (!ctx.from) return;

  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );

  const data: Record<string, unknown> = {
    userId: user.id,
    title: '',
    description: null as string | null,
    requiredXp: 0,
  };

  const steps: DialogState['steps'] = [
    {
      prompt: 'Введите название цели:',
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
      prompt: 'Введите описание цели (или отправьте "-", чтобы пропустить):',
      handler: (_chatId, text) => {
        data.description = text.trim() === '-' ? null : text.trim();
        return 'next';
      },
    },
    {
      prompt: 'Сколько опыта нужно набрать для завершения цели? (число):\n *Легкая ~5000 XP*\n*Средняя ~10000 XP*\n*Сложная ~20000 XP*',
      handler: async (_chatId, text) => {
        const xp = parseInt(text.trim().replaceAll(" ", ""), 10);
        if (isNaN(xp) || xp <= 0) {
          bot.api.sendMessage(_chatId, 'Введите положительное число');
          return 'retry';
        }
        data.requiredXp = xp;
        await saveGoal(_chatId, data);
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

  await ctx.reply('🔧 **Создание новой цели**', { parse_mode: 'Markdown' });
  startDialog(ctx.chat!.id, state);
}

async function saveGoal(chatId: number, data: Record<string, unknown>): Promise<void> {
  const goal = await createGoal({
    userId: data.userId as number,
    title: data.title as string,
    description: (data.description as string) ?? '',
    requiredXp: data.requiredXp as number,
  });

  await bot.api.sendMessage(
    chatId,
    `✅ Цель "${goal.title}" создана!\n\n` +
      `📝 Описание: ${goal.description || '—'}\n` +
      `⭐ Требуется опыта: ${formatNumber(goal.requiredXp)} XP`,
  );
}
