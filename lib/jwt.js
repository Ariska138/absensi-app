import { sign, verify } from 'hono/jwt';

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET belum diset di environment variable');
}

/**
 * Buat JWT token dari data user.
 * @param {{ id: number, name: string, role: string }} payload
 * @returns {Promise<string>} token
 */
export async function createToken(payload) {
  return await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expired 1 hari
    },
    SECRET,
    'HS256',
  );
}

/**
 * Verifikasi dan decode JWT token.
 * Lempar error jika token tidak valid atau expired.
 * @param {string} token
 * @returns {Promise<{ id: number, name: string, role: string }>}
 */
export async function verifyToken(token) {
  return await verify(token, SECRET, { alg: 'HS256' });
}
