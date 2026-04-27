import { Hono } from 'hono';
import { db } from '../db/index.js';
import { attendances, users } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

const user = new Hono();

// helper: cari user
async function findUser(identifier) {
  // bisa ID atau email
  if (Number(identifier)) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(identifier)));

    return result[0];
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, identifier));

  return result[0];
}

// =========================
// CHECK IN
// =========================
user.post('/check-in', async (c) => {
  const body = await c.req.json();
  const { identifier } = body;

  if (!identifier) {
    return c.json({ message: 'identifier wajib diisi' }, 400);
  }

  const user = await findUser(identifier);

  if (!user) {
    return c.json({ message: 'User tidak ditemukan' }, 404);
  }

  if (!user.is_active) {
    return c.json({ message: 'User tidak aktif' }, 403);
  }

  const now = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // cek sudah check-in
  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.user_id, user.id),
        gte(attendances.check_in, start),
        lte(attendances.check_in, end),
      ),
    );

  if (existing.length > 0) {
    return c.json({ message: 'Sudah check-in hari ini' }, 400);
  }

  await db.insert(attendances).values({
    user_id: user.id,
    check_in: now,
  });

  return c.json({
    message: `Check-in berhasil (${user.name})`,
  });
});

// =========================
// CHECK OUT
// =========================
user.post('/check-out', async (c) => {
  const body = await c.req.json();
  const { identifier } = body;

  if (!identifier) {
    return c.json({ message: 'identifier wajib diisi' }, 400);
  }

  const user = await findUser(identifier);

  if (!user) {
    return c.json({ message: 'User tidak ditemukan' }, 404);
  }

  const now = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.user_id, user.id),
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

  await db
    .update(attendances)
    .set({ check_out: now })
    .where(eq(attendances.id, attendance.id));

  return c.json({
    message: `Check-out berhasil (${user.name})`,
  });
});

export { user };
