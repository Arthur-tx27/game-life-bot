import { prisma } from '../lib/prisma';

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

  if (goal.currentXp >= goal.requiredXp && !goal.isCompleted) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { isCompleted: true },
    });
  }

  return goal;
}
