import path from 'path';
import type { Request } from 'express';
import { AnyZodObject, z, ZodError } from 'zod';

export async function zParse<T extends AnyZodObject>(
  schema: T,
  req: Request,
): Promise<z.infer<T> | void> {
  try {
    return await schema.parseAsync(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
    }
  }
}
