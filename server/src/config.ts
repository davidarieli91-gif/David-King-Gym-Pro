import 'dotenv/config';
import { z } from 'zod';

const booleanFromEnv = (def: boolean) =>
  z
    .preprocess((value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return def;
    }, z.boolean())
    .default(def);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default('0.0.0.0'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:8080'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  INVITE_PEPPER: z.string().min(16),
  COOKIE_SECURE: booleanFromEnv(false),
  SESSION_DAYS: z.coerce.number().int().positive().default(30),
  STORAGE_DIR: z.string().default('./data/files'),
  MAX_FILE_MB: z.coerce.number().positive().default(25),
  SERVE_STATIC: booleanFromEnv(false),
  STATIC_DIR: z.string().default('../dist'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('David King Gym <no-reply@localhost>'),
});

export type Config = z.infer<typeof envSchema>;

function loadConfig(): Config {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${details}`);
  }

  if (parsed.data.NODE_ENV === 'production') {
    if (parsed.data.SESSION_SECRET.includes('change-me') || parsed.data.INVITE_PEPPER.includes('change-me')) {
      throw new Error('Production secrets must not use the example values');
    }
    if (!parsed.data.COOKIE_SECURE) {
      throw new Error('COOKIE_SECURE must be true in production');
    }
  }

  return parsed.data;
}

export const config = loadConfig();
