import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = 'Password123!';

const seedUsers: { email: string; firstName: string; lastName: string; role: Role }[] = [
  { email: 'admin@worksphere.local', firstName: 'Alex', lastName: 'Admin', role: Role.ADMIN },
  { email: 'hr1@worksphere.local', firstName: 'Hana', lastName: 'Reyes', role: Role.HR_MANAGER },
  { email: 'hr2@worksphere.local', firstName: 'Omar', lastName: 'Siddiqui', role: Role.HR_MANAGER },
  { email: 'manager1@worksphere.local', firstName: 'Maria', lastName: 'Novak', role: Role.MANAGER },
  { email: 'manager2@worksphere.local', firstName: 'Liam', lastName: 'Chen', role: Role.MANAGER },
  { email: 'employee1@worksphere.local', firstName: 'Sofia', lastName: 'Costa', role: Role.EMPLOYEE },
  { email: 'employee2@worksphere.local', firstName: 'Noah', lastName: 'Kim', role: Role.EMPLOYEE },
  { email: 'employee3@worksphere.local', firstName: 'Ava', lastName: 'Johansson', role: Role.EMPLOYEE },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
  }

  console.log(`Seeded ${seedUsers.length} users. Dev password for all: ${DEV_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
