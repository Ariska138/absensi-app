import { getCookie } from 'hono/cookie';
import { verifyToken } from '../lib/jwt.js';

export const authMiddleware = async (c, next) => {
  const token = getCookie(c, 'session_token');

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  try {
    // Verifikasi signature dan expiry JWT — dilempar error jika tidak valid
    const user = await verifyToken(token);

    // Inject data user ke context request
    c.set('user', { id: user.id, name: user.name, role: user.role });

    await next();
  } catch (err) {
    // Tambahkan console.log ini untuk melihat penyebab error sebenarnya di terminal
    console.error('JWT Verification Error:', err.message);
    return c.json({ message: 'Session tidak valid atau sudah expired' }, 401);
  }
};
