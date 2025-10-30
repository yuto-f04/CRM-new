import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@local.test";
  const password = "password12345";
  const password_hash = await bcrypt.hash(password, 10);

  await prisma.users.upsert({
    where: { email },
    update: { password_hash, role: "admin", is_active: true, name: "Admin" },
    create: { email, name: "Admin", role: "admin", is_active: true, password_hash },
  });
  console.log("Seeded:", email);
}

main().finally(() => prisma.$disconnect());
