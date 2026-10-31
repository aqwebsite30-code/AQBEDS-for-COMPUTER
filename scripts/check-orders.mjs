import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const leads = await db.$queryRawUnsafe(
  `SELECT id, "customerName", "customerCity", source, "createdAt" FROM "WhatsAppLead" WHERE "createdAt" >= now() - interval '1 day' ORDER BY "createdAt"`,
);
console.log(
  "LEADS(1d):",
  JSON.stringify(leads, (_, v) => (v instanceof Date ? v.toISOString() : v), 2),
);
await db.$disconnect();
