import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

const auth = new Hono();

// simpan session
const sessions = new Map();

auth.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  // ambil user dari database
  const result = await db.select().from(users).where(eq(users.email, email));

  const user = result[0];

  // cek user
  if (!user) {
    return c.json({ message: 'User tidak ditemukan' }, 401);
  }

  // cek password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return c.json({ message: 'Password salah' }, 401);
  }

  // buat token
  const token = uuidv4();

  // simpan session
  // sessions.set(token, user);

  setCookie(
    c,
    'session',
    JSON.stringify({
      id: user.id,
      role: user.role,
    }),
    {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 hari
    },
  );

  return c.json({
    message: 'Login berhasil',
    token,
  });
});

auth.post('/logout', async (c) => {
  const token = c.req.header('Authorization');

  // sessions.delete(token);
  deleteCookie(c, 'session');

  return c.json({
    message: 'Logout berhasil',
  });
});

auth.get('/me', async (c) => {
  // const token = c.req.header('Authorization');

  // const user = sessions.get(token);

  const session = getCookie(c, 'session');

  if (!session) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  return c.json({
    user: JSON.parse(session),
  });
});

export { auth, sessions };
