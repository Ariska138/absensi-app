import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, attendances } from '../db/schema.js';
import { eq, and, gte, lt, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const admin = new Hono();

// Semua route admin wajib login dan role admin
admin.use('*', authMiddleware, adminOnly);

// ========================
// GET /admin/users
// Ambil semua user (tanpa password)
// ========================
admin.get('/users', async (c) => {
  const data = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      is_active: users.is_active,
    })
    .from(users)
    .orderBy(users.name);

  return c.json({ data });
});

// ========================
// POST /admin/users
// Tambah user baru
// ========================
admin.post('/users', async (c) => {
  const body = await c.req.json();
  const { name, email, password, role = 'user' } = body;

  if (!name || !email || !password) {
    return c.json({ message: 'name, email, dan password wajib diisi' }, 400);
  }

  if (!['user', 'admin'].includes(role)) {
    return c.json({ message: 'role harus user atau admin' }, 400);
  }

  if (password.length < 6) {
    return c.json({ message: 'Password minimal 6 karakter' }, 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [created] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role, is_active: true })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return c.json({ message: 'User berhasil ditambahkan', data: created }, 201);
  } catch {
    return c.json({ message: 'Email sudah digunakan' }, 400);
  }
});

// ========================
// GET /admin/attendances?month=YYYY-MM
// Rekap absensi per bulan (join dengan nama user)
// ========================
admin.get('/attendances', async (c) => {
  const month = c.req.query('month');

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ message: 'Parameter month wajib diisi (format: YYYY-MM)' }, 400);
  }

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const data = await db
    .select({
      id: attendances.id,
      user_id: attendances.user_id,
      user_name: users.name,
      user_email: users.email,
      check_in: attendances.check_in,
      check_out: attendances.check_out,
      note: attendances.note,
    })
    .from(attendances)
    .leftJoin(users, eq(attendances.user_id, users.id))
    .where(and(gte(attendances.check_in, start), lt(attendances.check_in, end)))
    .orderBy(attendances.check_in);

  return c.json({ data });
});

export default admin;