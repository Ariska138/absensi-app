import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import { auth } from './api/auth.js';
import admin from './api/admin.js';
import { user } from './api/user.js';

const app = new Hono();

app.use('/*', serveStatic({ root: './public' }));

app.route('/auth', auth);
app.route('/admin', admin);
app.route('/user', user);

// endpoint utama
app.get('/', (c) => {
  return c.text('Hello World');
});

// jalankan server
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log('info', info);
  },
);
