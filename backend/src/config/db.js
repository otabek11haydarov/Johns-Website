import pkg from '@prisma/client';
import 'dotenv/config';

const { PrismaClient } = pkg;

let prisma;

try {
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} catch (error) {
  prisma = new PrismaClient();
}

export default prisma;
