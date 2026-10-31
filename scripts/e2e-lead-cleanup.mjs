import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const r = await prisma.whatsAppLead.deleteMany({
  where: { customerName: { in: ["Gate Check", "Test User"] } },
});
console.log("DELETED:", r.count);
await prisma.$disconnect();
