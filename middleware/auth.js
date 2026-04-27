import { sessions } from '../api/auth.js';

export const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization');

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  const user = sessions.get(token);

  if (!user) {
    return c.json({ message: 'Invalid token' }, 401);
  }

  // simpan user ke context
  c.set('user', user);

  await next();
};
