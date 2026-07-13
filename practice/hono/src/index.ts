import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import z from 'zod';
import { zValidator } from '@hono/zod-validator';

class ValidationError extends HTTPException {
  constructor(message: string = 'Validation failed') {
    super(400, { message });
  }
}

const app = new Hono();

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

app.get('/error', (c) => {
  throw new HTTPException(404, { message: 'User not found' });
});

app.get('/error2', (c) => {
  const a: { b: string } | undefined = undefined;

  return c.json({
    a: a!.b,
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
