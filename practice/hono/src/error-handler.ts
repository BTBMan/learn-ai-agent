import { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class ValidationError extends HTTPException {
  constructor(message: string = 'Validation failed') {
    super(400, { message });
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  console.log(err);

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
};
