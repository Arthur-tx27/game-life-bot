import { bot } from '../bot';
import { showGoal } from './goals/view';
import { showGoalsList } from './goals/list';
import { startAddGoal } from './goals/add';
import {
  showSubtaskTypePicker,
  handleSubtaskType,
  handleSubtaskToggle,
} from './goals/subtasks';

bot.on('callback_query:data', async (ctx) => {
  const [action, ...rest] = ctx.callbackQuery.data.split(':');
  const param = rest.join(':');

  switch (action) {
    case 'goals_list':
      return showGoalsList(ctx);

    case 'goal':
      return showGoal(ctx, Number(param));

    case 'add_goal':
      await ctx.answerCallbackQuery();
      return startAddGoal(ctx);

    case 'add_subtask':
      return showSubtaskTypePicker(ctx, Number(param));

    case 'subtask_type': {
      const [goalIdStr, type] = param.split(':');
      return handleSubtaskType(ctx, Number(goalIdStr), type);
    }

    case 'subtask':
      return handleSubtaskToggle(ctx, Number(param));

    default:
      return ctx.answerCallbackQuery('Неизвестная команда');
  }
});
