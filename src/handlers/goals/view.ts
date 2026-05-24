import { InlineKeyboard } from 'grammy';
import { findGoal } from '../../services/goal';
import { formatNumber, formatGoalProgress, GOAL_XP_LINE_INDENT } from '../../lib/format';
import { getDailyCooldownRemaining } from '../../lib/cooldown';

const TYPE_ICONS: Record<string, string> = {
  DAILY: '🔄',
  MEDIUM: '📋',
  HARD: '💪',
};

export async function renderGoalView(goalId: number) {
  const goal = await findGoal(goalId);
  if (!goal) return null;

  const subtasks = (goal as any).subtasks as any[];

  const TYPE_ORDER: Record<string, number> = { DAILY: 0, MEDIUM: 1, HARD: 2 };
  subtasks.sort((a: any, b: any) => {
    const typeDiff = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
    if (typeDiff !== 0) return typeDiff;
    return a.id - b.id;
  });

  const keyboard = new InlineKeyboard();
  for (const s of subtasks) {
    const typeIcon = TYPE_ICONS[s.type] || '';
    const xpLabel = `+${formatNumber(s.xpReward)} XP`;

    const isSuccess =
      s.type === 'DAILY' ? !!getDailyCooldownRemaining(s.completedAt) : s.isCompleted;
    const text = `${typeIcon} ${s.title}  ${xpLabel}`;

    if (isSuccess) {
      keyboard.text(text, `subtask:${s.id}`).success();
    } else {
      keyboard.text(text, `subtask:${s.id}`);
    }

    keyboard.row();
  }

  if (!goal.isCompleted) {
    keyboard.text('➕ Добавить задачу', `add_subtask:${goalId}`);
  }

  const status = goal.isCompleted ? '✅' : '🎯';

  const text =
    `${status} ${goal.title}\n` +
    `⭐ ${formatGoalProgress(goal.currentXp, goal.requiredXp)}\n` +
    GOAL_XP_LINE_INDENT +
    `(${formatNumber(goal.currentXp)}/${formatNumber(goal.requiredXp)} XP)\n` +
    `📝 ${goal.description || 'нет описания'}`;

  return { text, keyboard };
}

export async function showGoal(ctx: any, goalId: number) {
  if (!ctx.from) return;

  const view = await renderGoalView(goalId);
  if (!view) {
    return ctx.answerCallbackQuery('Цель не найдена');
  }

  await ctx.editMessageText(view.text, { reply_markup: view.keyboard });
}
