import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

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
