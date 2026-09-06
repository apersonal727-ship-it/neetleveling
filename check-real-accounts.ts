import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const byEmail = await prisma.profile.findUnique({
    where: { email: "apersonal727@gmail.com" },
    select: { id: true, name: true, email: true, hunterId: true, createdAt: true, subscriptionStatus: true },
  });

  const byName = await prisma.profile.findMany({
    where: { name: { contains: "Akassh", mode: "insensitive" } },
    select: { id: true, name: true, email: true, hunterId: true, createdAt: true, subscriptionStatus: true },
  });

  const totalCount = await prisma.profile.count();
  const testCount = await prisma.profile.count({ where: { email: { contains: "claude-qa-test" } } });

  console.log(JSON.stringify({ byEmail, byName, totalProfiles: totalCount, testProfiles: testCount, realProfiles: totalCount - testCount }, null, 2));
  await prisma.$disconnect();
}

main();
