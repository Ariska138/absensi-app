import { Hono } from 'hono';
import { db } from '../db/index.js';
import { attendances } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';

const user = new Hono();

// semua endpoint harus login
user.use('*', authMiddleware);

user.post('/check-in', async (c) => {
  const currentUser = c.get('user');

  const now = new Date();

  // awal hari
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  // akhir hari
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // cek apakah sudah check-in hari ini
  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.user_id, currentUser.id),
        gte(attendances.check_in, start),
        lte(attendances.check_in, end),
      ),
    );

  if (existing.length > 0) {
    return c.json({ message: 'Sudah check-in hari ini' }, 400);
  }

  // insert check-in
  await db.insert(attendances).values({
    user_id: currentUser.id,
    check_in: now,
  });

  return c.json({
    message: 'Check-in berhasil',
  });
});

user.post('/check-out', async (c) => {
  const currentUser = c.get('user');

  const now = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // cari data hari ini
  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.user_id, currentUser.id),
        gte(attendances.check_in, start),
        lte(attendances.check_in, end),
      ),
    );

  const attendance = existing[0];

  if (!attendance) {
    return c.json({ message: 'Belum check-in' }, 400);
  }

  if (attendance.check_out) {
    return c.json({ message: 'Sudah check-out' }, 400);
  }

  // update check_out
  await db
    .update(attendances)
    .set({ check_out: now })
    .where(eq(attendances.id, attendance.id));

  return c.json({
    message: 'Check-out berhasil',
  });
});
