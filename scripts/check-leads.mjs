import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client);
const rows = await db.execute(sql`
  SELECT id, source, "sourceButton", value, "visitorId", "createdAt"
  FROM "WhatsAppLead"
  ORDER BY "createdAt" DESC
  LIMIT 8
`);
console.log(JSON.stringify(rows.rows ?? rows, null, 2));
