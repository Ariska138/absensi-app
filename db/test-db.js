import { db } from './index.js';
import { users } from './schema.js';

const run = async () => {
  const result = await db.select().from(users);
  console.log(result);
};

run();
