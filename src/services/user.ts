import { prisma } from '../lib/prisma';

export async function findOrCreateUser(telegramId: number, username?: string, firstName?: string) {
  return prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    update: { username, firstName },
    create: { telegramId: BigInt(telegramId), username, firstName },
  });
}
