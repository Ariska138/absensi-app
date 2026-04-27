import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const admin = new Hono();

// gunakan middleware
admin.use('*', authMiddleware, adminOnly);

// contoh endpoint
admin.get('/dashboard', (c) => {
  return c.json({
    message: 'Selamat datang admin',
  });
});

admin.post('/users', async (c) => {
  const body = await c.req.json();
  const { name, email, password } = body;

  // validasi sederhana
  if (!name || !email || !password) {
    return c.json({ message: 'Semua field wajib diisi' }, 400);
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      is_active: true,
    });

    return c.json({
      message: 'User berhasil ditambahkan',
    });
  } catch (error) {
    return c.json({ message: 'Email sudah digunakan' }, 400);
  }
});

admin.patch('/users/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const { is_active } = body;

  if (typeof is_active !== 'boolean') {
    return c.json({ message: 'is_active harus boolean' }, 400);
  }

  await db.update(users).set({ is_active }).where(eq(users.id, id));

  return c.json({
    message: 'Status berhasil diubah',
  });
});

admin.get('/attendances', async (c) => {
  const month = c.req.query('month'); // format: 2026-01

  if (!month) {
    return c.json({ message: 'month wajib diisi (YYYY-MM)' }, 400);
  }

  const start = new Date(`${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const data = await db
    .select({
      id: attendances.id,
      user_id: attendances.user_id,
      check_in: attendances.check_in,
      check_out: attendances.check_out,
      note: attendances.note,
    })
    .from(attendances)
    .where(
      and(gte(attendances.check_in, start), lte(attendances.check_in, end)),
    );

  return c.json({
    data,
  });
});
export default admin;
