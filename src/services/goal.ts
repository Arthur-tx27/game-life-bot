import { prisma } from '../lib/prisma';

export async function getUserGoals(userId: number) {
  return prisma.goal.findMany({
    where: { userId },
    include: { subtasks: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createGoal(data: {
  userId: number;
  title: string;
  description: string;
  requiredXp: number;
  subtasks: { title: string; xpReward: number }[];
}) {
  return prisma.goal.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      requiredXp: data.requiredXp,
      subtasks: { create: data.subtasks },
    },
    include: { subtasks: true },
  });
}
