import { bot } from '../bot';
import { showGoal } from './goals/view';
import { showGoalsList } from './goals/list';
import { startAddGoal } from './goals/add';

bot.on('callback_query:data', async (ctx) => {
  const [action, param] = ctx.callbackQuery.data.split(':');
  switch (action) {
    case 'goals_list':
      return showGoalsList(ctx);
    case 'goal':
      return showGoal(ctx, Number(param));
    case 'add_goal':
      await ctx.answerCallbackQuery();
      return startAddGoal(ctx);
    case 'add_subtask':
      return ctx.editMessageText(`🚧 Скоро тут будет добавление задачи к цели #${param}`);
    case 'subtask':
      return ctx.editMessageText(`🚧 Подзадача #${param}`);
    default:
      return ctx.answerCallbackQuery('Неизвестная команда');
  }
});
