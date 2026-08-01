import prisma from '../config/db.js';

const LESSON_ID = 'ebedd118-c413-4c9f-bbac-dd4c9adab0d5';

const tasks = await prisma.task.findMany({
  where: { lessonId: LESSON_ID },
  orderBy: { order: 'asc' }
});

const seen = {};
const toDelete = [];
for (const t of tasks) {
  if (seen[t.type]) {
    toDelete.push(t.id);
  } else {
    seen[t.type] = t.id;
  }
}

if (toDelete.length > 0) {
  await prisma.task.deleteMany({ where: { id: { in: toDelete } } });
  console.log(`Deleted ${toDelete.length} duplicate task(s):`, toDelete);
} else {
  console.log('No duplicates found');
}

const remaining = await prisma.task.findMany({
  where: { lessonId: LESSON_ID },
  select: { id: true, type: true, order: true }
});
console.log('Remaining tasks:', JSON.stringify(remaining, null, 2));

await prisma.$disconnect();
