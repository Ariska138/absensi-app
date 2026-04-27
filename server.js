import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { auth } from './api/auth';
import admin from './api/admin';

const app = new Hono();

app.route('/auth', auth);
app.route('/admin', admin);

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
