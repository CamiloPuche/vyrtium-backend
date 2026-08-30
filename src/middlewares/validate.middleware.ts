import { Request, Response, NextFunction } from 'express';
import * as z from 'zod';

export const validate =
  (schema: z.ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
