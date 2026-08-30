import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { JwtPayload } from '../modules/auth/auth.interface';

export const authenticateJwt = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Token de autenticación no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'Token de autenticación no proporcionado');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError(500, 'JWT_SECRET no configurado en el servidor', false);
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      throw new AppError(401, 'Token de autenticación inválido o expirado');
    }

    // Verify user exists, session is active and tokenVersion matches
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.sub } });

    if (!user || user.tokenVersion !== payload.tokenVersion || !user.refreshTokenHash) {
      throw new AppError(401, 'Usuario no encontrado o sesión revocada');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};
