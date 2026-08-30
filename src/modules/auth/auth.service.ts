import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../../config/database';
import { User } from '../../entities/User';
import { AppError } from '../../errors/AppError';
import { RegisterInput, LoginInput } from './auth.schema';
import {
  AuthResponse,
  AuthTokens,
  RegisterResponse,
  RefreshTokenResponse,
  JwtPayload,
} from './auth.interface';

export class AuthService {
  private readonly saltRounds = 12;
  private userRepository = AppDataSource.getRepository(User);

  private getJwtSecrets() {
    const accessSecret = process.env.JWT_SECRET;
    if (!accessSecret) {
      throw new AppError(500, 'JWT_SECRET no configurado en el servidor', false);
    }

    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || `${accessSecret}_refresh_secure_fallback`;

    const accessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ||
      '15m') as SignOptions['expiresIn'];
    const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
      '7d') as SignOptions['expiresIn'];

    return { accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn };
  }

  private async generateTokenPair(
    user: User,
    inheritedExp?: number
  ): Promise<AuthTokens> {
    const { accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn } =
      this.getJwtSecrets();

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion,
      },
      accessSecret,
      { expiresIn: accessExpiresIn }
    );

    // Absolute Session Lifetime: Inherit remaining seconds from initial login session
    let refreshSignOptions: SignOptions;
    if (inheritedExp) {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const remainingSeconds = inheritedExp - currentTimestamp;

      if (remainingSeconds <= 0) {
        throw new AppError(
          401,
          'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
        );
      }

      refreshSignOptions = { expiresIn: remainingSeconds };
    } else {
      refreshSignOptions = { expiresIn: refreshExpiresIn };
    }

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion,
      },
      refreshSecret,
      refreshSignOptions
    );

    // Hash refresh token before persisting to database
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);
    user.refreshTokenHash = refreshTokenHash;
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError(409, 'El correo electrónico ya se encuentra registrado');
    }

    const passwordHash = await bcrypt.hash(input.password, this.saltRounds);

    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      refreshTokenHash: null,
      tokenVersion: 0,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    // Timing-safe response: generic 401 error message
    if (!user) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    const tokens = await this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async refreshToken(rawRefreshToken: string): Promise<RefreshTokenResponse> {
    const { refreshSecret } = this.getJwtSecrets();

    let payload: JwtPayload;
    try {
      payload = jwt.verify(rawRefreshToken, refreshSecret) as JwtPayload;
    } catch {
      throw new AppError(401, 'Token de actualización inválido o expirado');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash || user.tokenVersion !== payload.tokenVersion) {
      throw new AppError(401, 'Sesión no válida o revocada');
    }

    const isTokenMatch = await bcrypt.compare(
      rawRefreshToken,
      user.refreshTokenHash
    );

    if (!isTokenMatch) {
      // Possible token reuse attempt: invalidate session immediately
      user.refreshTokenHash = null;
      user.tokenVersion += 1;
      await this.userRepository.save(user);
      throw new AppError(401, 'Token de actualización inválido o reutilizado');
    }

    // Token rotation with Absolute Lifetime inheritance:
    user.tokenVersion += 1;
    const newTokens = await this.generateTokenPair(user, payload.exp);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.refreshTokenHash = null;
      user.tokenVersion += 1;
      await this.userRepository.save(user);
    }
  }
}

export const authService = new AuthService();
