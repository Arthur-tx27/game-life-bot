import { InlineKeyboard } from 'grammy';
import { findGoal } from '../../services/goal';
import { formatNumber, formatGoalProgress, GOAL_XP_LINE_INDENT } from '../../lib/format';

export async function showGoal(ctx: any, goalId: number) {
  if (!ctx.from) return;

  const goal = await findGoal(goalId);

  if (!goal) {
    return ctx.answerCallbackQuery('Цель не найдена');
  }

  const subtasks = 'subtasks' in goal ? (goal as any).subtasks : [];

  const keyboard = new InlineKeyboard();
  for (const s of subtasks) {
    const icon = s.isCompleted ? '✅' : '⬜';
    keyboard.text(
      `${icon} ${s.title}  +${formatNumber(s.xpReward)} XP`,
      `subtask:${s.id}`,
    );
    keyboard.row();
  }
  keyboard.text('➕ Добавить задачу', `add_subtask:${goalId}`);

  await ctx.editMessageText(
    `🎯 ${goal.title}\n` +
      `⭐ ${formatGoalProgress(goal.currentXp, goal.requiredXp)}\n` +
      GOAL_XP_LINE_INDENT +
      `(${formatNumber(goal.currentXp)}/${formatNumber(goal.requiredXp)} XP)\n` +
      `📝 ${goal.description || 'нет описания'}`,
    { reply_markup: keyboard },
  );
}
