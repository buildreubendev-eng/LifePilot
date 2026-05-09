import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingTables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'LifeAdminMessage'
  `;

  if (Array.isArray(existingTables) && existingTables.length > 0) {
    console.log("PLOS database schema already exists.");
    return;
  }

  const migrationPath = join(process.cwd(), "prisma", "migrations", "00000000000000_init", "migration.sql");
  const migration = await readFile(migrationPath, "utf8");
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log(`Applied ${statements.length} PLOS database migration statement(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
