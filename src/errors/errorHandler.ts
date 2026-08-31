import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { QueryFailedError } from 'typeorm';
import { AppError } from './AppError';
import logger from '../utils/logger';

interface DatabaseDriverError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Handle Domain AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // 2. Handle Zod Validation Errors
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

  // 3. Handle Multer File Upload Errors
  if (err instanceof MulterError) {
    let message = 'Error en la carga de archivos';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'El archivo supera el tamaño máximo permitido de 5MB';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Campo de archivo no esperado o formato incorrecto';
    }

    res.status(400).json({
      success: false,
      error: message,
    });
    return;
  }

  // 4. Handle JSON Body Parser Syntax Errors
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: number }).status === 400
  ) {
    res.status(400).json({
      success: false,
      error: 'Formato JSON en el cuerpo de la petición no válido',
    });
    return;
  }

  // 5. Handle TypeORM & PostgreSQL Database Driver Errors
  if (err instanceof QueryFailedError || 'code' in err) {
    const dbErr = err as DatabaseDriverError;
    const pgCode = dbErr.code;

    // 22003: Numeric or integer value out of range
    if (pgCode === '22003') {
      res.status(400).json({
        success: false,
        error: 'El valor numérico ingresado supera el límite permitido en la base de datos',
      });
      return;
    }

    // 22P02: Invalid text representation (e.g. invalid UUID or type mismatch)
    if (pgCode === '22P02') {
      res.status(400).json({
        success: false,
        error: 'Formato de identificador o tipo de dato inválido',
      });
      return;
    }

    // 23505: Unique violation (e.g. duplicate email or name)
    if (pgCode === '23505') {
      res.status(409).json({
        success: false,
        error: 'El registro ya existe con los mismos datos únicos',
      });
      return;
    }

    // 23503: Foreign key violation
    if (pgCode === '23503') {
      res.status(409).json({
        success: false,
        error: 'La operación no se puede completar debido a restricciones de relaciones existentes',
      });
      return;
    }

    // 23514: Check constraint violation
    if (pgCode === '23514') {
      res.status(400).json({
        success: false,
        error: 'Los valores ingresados no cumplen con las reglas de validación de la base de datos',
      });
      return;
    }
  }

  // 6. Handle Unexpected Internal Server Errors
  logger.error({ err }, 'Unhandled Internal Error');

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
  });
};
