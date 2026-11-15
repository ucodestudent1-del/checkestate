import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  }) as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db as PrismaClient;

export default db;
