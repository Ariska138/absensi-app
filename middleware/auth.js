import { getCookie } from 'hono/cookie';
import { sessions } from '../api/auth.js';

export const authMiddleware = async (c, next) => {
  const session = getCookie(c, 'session');

  if (!session) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  try {
    const user = JSON.parse(session);

    // inject ke context
    c.set('user', user);

    await next();
  } catch (err) {
    return c.json({ message: 'Invalid session' }, 401);
  }
};
