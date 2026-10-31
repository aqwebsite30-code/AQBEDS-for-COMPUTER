import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const leads = await prisma.whatsAppLead.deleteMany({
  where: { customerName: { in: ["Gate Check", "Test User", "TEC Check", "test"] } },
});
console.log("LEADS DELETED:", leads.count);

const orders = await prisma.order.deleteMany({
  where: { OR: [{ customerName: { in: ["TEC Verify", "Test User"] } }, { customerEmail: "tecverify@aqbeds-test.com" }] },
});
console.log("ORDERS DELETED:", orders.count);

// Test Purchase event from the verify-place-order run (value 650, "1 item(s)").
const evts = await prisma.analyticsEvent.deleteMany({
  where: {
    event: "Purchase",
    value: 650,
    productName: "1 item(s)",
    createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
  },
});
console.log("PURCHASE EVENTS DELETED:", evts.count);

await prisma.$disconnect();

