import { Hono, MiddlewareHandler } from 'hono';
import { jwt, JwtVariables, sign } from 'hono/jwt';

interface Bindings {
  JWT_SECRET: string;
}

interface AppEnv {
  Bindings: Bindings;
}

interface AuthEnv extends AppEnv {
  Variables: JwtVariables<{
    userId: number;
    email: string;
    role: string;
    exp: number;
  }>;
}

const app = new Hono<AuthEnv>();

app.use('/auth/*', (c, next) => {
  return jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next);
});

const users = [
  { id: 1, email: 'alice@example.com', password: '123456', role: 'admin' },
  { id: 2, email: 'bob@example.com', password: 'abcdef', role: 'user' },
];

app.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 小时过期
    },
    c.env.JWT_SECRET,
  );

  return c.json({
    token,
  });
});

app.get('/auth/info', (c) => {
  const payload = c.get('jwtPayload');

  return c.json({
    ...payload,
  });
});

const requireRole = (role: string): MiddlewareHandler<AuthEnv> => {
  return async (c, next) => {
    const payload = c.get('jwtPayload');

    if (payload.role !== role) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await next();
  };
};

app.delete('/auth/users/:id', requireRole('admin'), (c) => {
  const userId = c.req.param('id');

  return c.json({ message: `User ${userId} deleted` });
});

export default app;
