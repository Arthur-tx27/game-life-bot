import { prisma } from '../lib/prisma';
import { getDailyCooldownRemaining } from '../lib/cooldown';

export async function getUserGoals(userId: number) {
  return prisma.goal.findMany({
    where: { userId },
    include: { subtasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findGoal(goalId: number) {
  return prisma.goal.findUnique({
    where: { id: goalId },
    include: { subtasks: true },
  });
}

export async function createGoal(data: {
  userId: number;
  title: string;
  description: string;
  requiredXp: number;
  subtasks?: { title: string; xpReward: number }[];
}) {
  return prisma.goal.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      requiredXp: data.requiredXp,
      ...(data.subtasks && { subtasks: { create: data.subtasks } }),
    },
    include: { subtasks: true },
  });
}

export async function addXpToGoal(goalId: number, xp: number) {
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { currentXp: { increment: xp } },
  });

  if (goal.currentXp < 0) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { currentXp: 0 },
    });
    goal.currentXp = 0;
  }

  if (goal.currentXp >= goal.requiredXp && !goal.isCompleted) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { isCompleted: true },
    });
    await prisma.subtask.deleteMany({
      where: { goalId, isCompleted: false },
    });
  }

  return goal;
}

export async function addXpToUser(userId: number, xp: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { totalXp: { increment: xp } },
  });
}

export async function createSubtask(data: {
  goalId: number;
  title: string;
  type: 'DAILY' | 'MEDIUM' | 'HARD';
  xpReward: number;
}) {
  const goal = await prisma.goal.findUnique({ where: { id: data.goalId } });
  if (!goal) throw new Error('Цель не найдена');
  if (goal.isCompleted) throw new Error('Нельзя добавить задачу к выполненной цели');

  return prisma.subtask.create({ data });
}

interface ToggleSubtaskResult {
  goalId: number;
}

export async function toggleSubtask(subtaskId: number): Promise<ToggleSubtaskResult> {
  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { goal: true },
  });

  if (!subtask) throw new Error('Задача не найдена');
  if (subtask.goal.isCompleted) throw new Error('Цель уже выполнена');

  if (subtask.type === 'DAILY') {
    const remaining = getDailyCooldownRemaining(subtask.completedAt);
    if (remaining) {
      throw new Error(`Кулдаун: ${remaining}`);
    }

    await prisma.subtask.update({
      where: { id: subtaskId },
      data: { completedAt: new Date() },
    });

    await addXpToGoal(subtask.goalId, subtask.xpReward);
    await addXpToUser(subtask.goal.userId, subtask.xpReward);
  } else {
    const newCompleted = !subtask.isCompleted;
    await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted: newCompleted },
    });

    if (newCompleted) {
      await addXpToGoal(subtask.goalId, subtask.xpReward);
      await addXpToUser(subtask.goal.userId, subtask.xpReward);
    } else {
      await addXpToGoal(subtask.goalId, -subtask.xpReward);
      await addXpToUser(subtask.goal.userId, -subtask.xpReward);
    }
  }

  return { goalId: subtask.goalId };
}
