import { PrismaClient } from "@prisma/client";

// Singleton para evitar múltiples instancias de PrismaClient durante
// hot-reload en desarrollo (cada recarga de módulo crearía una nueva
// conexión si no se cachea en el objeto global).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
