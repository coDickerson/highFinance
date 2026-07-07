import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { reseedDemo } from "../src/lib/demo-seed";

const connectionString = (process.env.DIRECT_URL ?? process.env.DATABASE_URL)!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

reseedDemo(prisma)
  .then(() => {
    console.log("✓ Seed complete");
    console.log("  Admin:    admin@highfinance.test / Admin1234");
    console.log("  Officers: social@highfinance.test / Officer1234 (and 13 others)");
  })
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
