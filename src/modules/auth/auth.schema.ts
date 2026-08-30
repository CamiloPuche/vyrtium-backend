import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('El formato del correo electrónico es inválido')
    .max(255, 'El correo no puede exceder 255 caracteres'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('El formato del correo electrónico es inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'El token de actualización (refreshToken) es obligatorio'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
