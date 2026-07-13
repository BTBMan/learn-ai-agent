import { Hono } from 'hono';
import { jwt, JwtVariables, sign } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import z from 'zod';
import { zValidator } from '@hono/zod-validator';

class ValidationError extends HTTPException {
  constructor(message: string = 'Validation failed') {
    super(400, { message });
  }
}

interface Bindings {
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Bindings; Variables: JwtVariables }>();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

app.post(
  '/users',
  zValidator('json', createUserSchema, (result, c) => {
    if (!result.success) {
      throw new ValidationError();
    }
  }),
  (c) => {
    const data = c.req.valid('json');

    return c.json({ id: 1, ...data }, 201);
  },
);

app.get('/error', () => {
  throw new HTTPException(404, { message: 'User not found' });
});

app.get('/error2', (c) => {
  const a: { b: string } | undefined = undefined;

  return c.json({
    a: a!.b,
  });
});

// jwt
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

app.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json(
      {
        success: false,
        message: err.message,
        code: 'VALIDATION_ERROR',
      },
      err.status,
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.status,
    );
  }

  return c.json(
    {
      success: false,
      message: 'Internal Server Error',
    },
    500,
  );
});

export default app;
