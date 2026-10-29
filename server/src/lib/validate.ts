import { ZodError, ZodSchema } from 'zod';
import { errors } from './errors';

export function parse<T>(schema: ZodSchema<T>, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw errors.badRequest('Validation failed', error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })));
    }
    throw error;
  }
}
