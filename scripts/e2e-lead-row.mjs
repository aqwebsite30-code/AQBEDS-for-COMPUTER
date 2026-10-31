import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const mode = process.argv[2];

if (mode === "insert") {
  const r = await prisma.whatsAppLead.create({
    data: {
      eventId: "e2e-wa-test-0001",
      source: "pdp",
      value: 650,
      currency: "GBP",
      contents:
        '[{"id":"lucca-anton-sofa-bed","name":"Lucca & Anton Sofa Bed","quantity":1,"item_price":650}]',
      customerName: "Test User",
      customerCity: "Leeds",
      pageUrl: "http://localhost:5199/product/lucca-anton-sofa-bed",
      visitorId: "e2e-visitor-0001",
    },
  });
  console.log("INSERTED:", r.id, r.eventId, r.source);
} else if (mode === "cleanup") {
  const r = await prisma.whatsAppLead.deleteMany({
    where: { eventId: { startsWith: "e2e-wa-test-" } },
  });
  console.log("DELETED count:", r.count);
} else if (mode === "list") {
  const rows = await prisma.whatsAppLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { eventId: true, source: true, value: true, createdAt: true },
  });
  console.log(JSON.stringify(rows, null, 2));
}
await prisma.$disconnect();
