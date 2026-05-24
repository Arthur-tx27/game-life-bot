import { InlineKeyboard } from 'grammy';
import { showGoal } from '../view';
import { toggleSubtask } from '../../../services/goal';
import { startAddSubtask } from './add';

export async function showSubtaskTypePicker(ctx: any, goalId: number) {
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

export async function handleSubtaskType(
  ctx: any,
  goalId: number,
  type: string,
) {
  if (!['DAILY', 'MEDIUM', 'HARD'].includes(type)) {
    return ctx.answerCallbackQuery('Неизвестный тип задачи');
  }
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage().catch(() => {});
  return startAddSubtask(ctx, goalId, type as 'DAILY' | 'MEDIUM' | 'HARD');
}

export async function handleSubtaskToggle(ctx: any, subtaskId: number) {
  try {
    const result = await toggleSubtask(subtaskId);
    await ctx.answerCallbackQuery('✅ Выполнено!');
    return showGoal(ctx, result.goalId);
  } catch (err: any) {
    return ctx.answerCallbackQuery(err.message || 'Ошибка');
  }
}
