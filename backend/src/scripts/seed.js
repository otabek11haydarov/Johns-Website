import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const taskTypes = [
  { code: 'VIDEO', name: 'Video', icon: 'bi-play-circle', color: '#3b82f6', description: 'Video lesson content', displayOrder: 1 },
  { code: 'VOCABULARY', name: 'Vocabulary', icon: 'bi-translate', color: '#8b5cf6', description: 'Word lists and flashcards', displayOrder: 2 },
  { code: 'GRAMMAR', name: 'Grammar', icon: 'bi-spellcheck', color: '#f97316', description: 'Grammar rules and tests', displayOrder: 3 },
  { code: 'FLASHCARD', name: 'Flashcard', icon: 'bi-card-text', color: '#ec4899', description: 'Interactive flip cards', displayOrder: 4 },
  { code: 'READING', name: 'Reading', icon: 'bi-book', color: '#10b981', description: 'Reading comprehension text', displayOrder: 5 },
  { code: 'LISTENING', name: 'Listening', icon: 'bi-earbuds', color: '#f59e0b', description: 'Audio listening tasks', displayOrder: 6 },
  { code: 'WRITING', name: 'Writing', icon: 'bi-pencil-square', color: '#ef4444', description: 'Writing prompt', displayOrder: 7 },
  { code: 'SPEAKING', name: 'Speaking', icon: 'bi-mic', color: '#14b8a6', description: 'Voice recording prompt', displayOrder: 8 }
];

async function main() {
  console.log('Seeding task types...');
  for (const t of taskTypes) {
    await prisma.lessonTaskType.upsert({
      where: { code: t.code },
      update: t,
      create: t
    });
  }
  console.log('Task types seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
