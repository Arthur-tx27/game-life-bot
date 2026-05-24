import { InlineKeyboard } from 'grammy';
import { getUserGoals } from '../../services/goal';
import { findOrCreateUser } from '../../services/user';

export async function showGoalsList(ctx: any) {
  if (!ctx.from) return;

  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );
  const goals = await getUserGoals(user.id);
  const keyboard = new InlineKeyboard();
  for (const goal of goals) {
    const status = goal.isCompleted ? '✅' : '⏳';
    keyboard.text(`${status} ${goal.title}`, `goal:${goal.id}`);
    keyboard.row();
  }
  keyboard.text('➕ Добавить цель', 'add_goal');
  await ctx.reply('📋 Твои цели:', { reply_markup: keyboard });
}
