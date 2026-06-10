import { Context } from 'grammy';
import { Goal } from '@prisma/client';
import { findOrCreateUser } from '../services/user';
import { getUserGoals } from '../services/goal';
import { getProfileCard, buildProfileCaption, ProfileCard } from '../services/profile';
import { formatGoalProgress, GOAL_XP_LINE_INDENT } from '../lib/format';
import { mainMenuKeyboard } from './menu';

/** Отправляет карточку профиля и закрепляет её в чате */
export async function sendPinnedProfileCard(
  ctx: Context,
  card: ProfileCard,
  extra?: string,
): Promise<void> {
  if (!ctx.chat) return;

  const caption = buildProfileCaption(card, extra);

  const msg = await ctx.replyWithPhoto(card.avatar, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard,
  });

  await ctx.api
    .pinChatMessage(ctx.chat.id, msg.message_id, {
      disable_notification: true,
    })
    .catch(() => {});
}

function buildGoalsSummary(goals: Goal[]): string {
  if (goals.length === 0) {
    return '\n\n📋 Целей пока нет.';
  }

  const activeLines = goals
    .filter((goal) => !goal.isCompleted)
    .map(
      (goal) => `
🎯 ${goal.title}
${GOAL_XP_LINE_INDENT}${formatGoalProgress(goal.currentXp, goal.requiredXp)}`,
    );
  const doneLines = goals
    .filter((goal) => goal.isCompleted)
    .map((goal) => `\n✅ ${goal.title}`);

  return `\n\n📋 **Цели**:${activeLines.join('')}${doneLines.join('')}`;
}

export async function showProfile(ctx: Context) {
  if (!ctx.from || !ctx.chat) return;

  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );

  const card = getProfileCard(user.totalXp, user.firstName);
  const goals = await getUserGoals(user.id);

  await sendPinnedProfileCard(ctx, card, buildGoalsSummary(goals));
}
