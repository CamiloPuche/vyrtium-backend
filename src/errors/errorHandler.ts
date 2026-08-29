import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';
import logger from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle AppError (Known domain/business errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Handle Zod validation errors (boundary errors)
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  // Handle unexpected internal server errors
  logger.error({ err }, 'Unhandled Internal Error');

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
  });
};
