import { Context, InlineKeyboard } from 'grammy';
import { SUBTASK_TYPE } from '@prisma/client';
import { showGoal } from '../view';
import { toggleSubtask } from '../../../services/goal';
import { startAddSubtask } from './add';

function isSubtaskType(value: string): value is SUBTASK_TYPE {
  return value in SUBTASK_TYPE;
}

export async function showSubtaskTypePicker(ctx: Context, goalId: number) {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .text('🔄 Ежедневная', `subtask_type:${goalId}:DAILY`)
    .row()
    .text('📋 Средняя', `subtask_type:${goalId}:MEDIUM`)
    .row()
    .text('💪 Сложная', `subtask_type:${goalId}:HARD`);
  return ctx.editMessageText('Выберите тип задачи:', {
    reply_markup: keyboard,
  });
}

export async function handleSubtaskType(ctx: Context, goalId: number, type: string) {
  if (!isSubtaskType(type)) {
    return ctx.answerCallbackQuery('Неизвестный тип задачи');
  }
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage().catch(() => {});
  return startAddSubtask(ctx, goalId, type);
}

export async function handleSubtaskToggle(ctx: Context, subtaskId: number) {
  try {
    const result = await toggleSubtask(subtaskId);
    await ctx.answerCallbackQuery('✅ Выполнено!');
    return showGoal(ctx, result.goalId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка';
    return ctx.answerCallbackQuery(message);
  }
}
