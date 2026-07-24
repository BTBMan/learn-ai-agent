import { Hono } from 'hono';
import { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.get('/log/a', async (c) => {
  console.log('log/a');
  return c.json({ message: 'OK' }, 200);
});

app.get('/log/b', async (c) => {
  c.env.ANALYTICS.writeDataPoint({
    blobs: ['gpt', 'key_id_001', 'success'],
    doubles: [589, Date.now()],
    indexes: ['key_id_001'],
  });

  return c.json({ message: 'OK' }, 200);
});

export default app;
