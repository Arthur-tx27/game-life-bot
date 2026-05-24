import { findOrCreateUser } from '../services/user';
import { getUserGoals } from '../services/goal';
import { getProfileCard, buildProfileCaption } from '../services/profile';
import { formatGoalProgress, GOAL_XP_LINE_INDENT } from '../lib/format';
import { mainMenuKeyboard } from './menu';

export async function showProfile(ctx: any) {
  if (!ctx.from) return;

  const user = await findOrCreateUser(
    ctx.from.id,
    ctx.from.username,
    ctx.from.first_name,
  );

  const card = getProfileCard(user.totalXp, user.firstName);

  const goals = await getUserGoals(user.id);

  let extra: string;
  if (goals.length === 0) {
    extra = '\n\n📋 Целей пока нет.';
  } else {
    const activeGoals = goals.filter((g) => !g.isCompleted);
    const doneGoals = goals.filter((g) => g.isCompleted);

    const activeLines = activeGoals.map((g) => {
      return (
        `\n🎯 ${g.title}\n` +
        GOAL_XP_LINE_INDENT +
        `${formatGoalProgress(g.currentXp, g.requiredXp)}`
      );
    });
    const doneLines = doneGoals.map((g) => `\n✅ ${g.title}`);
    extra = '\n\n📋 **Цели**:' + activeLines.join('') + doneLines.join('');
  }

  const caption = buildProfileCaption(card, extra);

  await ctx.replyWithPhoto(card.avatar, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard,
  });
}
