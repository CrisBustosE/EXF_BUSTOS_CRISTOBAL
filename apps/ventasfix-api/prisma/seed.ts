import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@ventasfix.cl";
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const rut = process.env.ADMIN_RUT ?? "11111111-1";
  const passwordHash = await argon2.hash(password);

  await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: { rut, nombre: "Admin", apellido: "VentasFix", email, password: passwordHash },
  });

  console.log(`Usuario administrador listo: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
