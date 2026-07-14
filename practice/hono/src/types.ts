import { JwtVariables } from 'hono/jwt';

export interface AppEnv {
  Bindings: CloudflareBindings;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

export interface AuthEnv extends AppEnv {
  Variables: JwtVariables<JwtPayload>;
}
