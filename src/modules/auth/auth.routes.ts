import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';

const router = Router();

/**
 * @openapi
 * /api/auth/registro:
 *   post:
 *     summary: Registro de nuevo usuario
 *     description: Crea una nueva cuenta de usuario con contraseña cifrada mediante bcrypt.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@vyrtium.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: Secret123!
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario registrado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: Juan Pérez
 *                     email:
 *                       type: string
 *                       example: usuario@vyrtium.com
 *       400:
 *         description: Error de validación en los campos enviados.
 *       409:
 *         description: El correo electrónico ya se encuentra registrado.
 */
router.post('/registro', validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicio de sesión
 *     description: Valida las credenciales del usuario y retorna un par de tokens (Access Token 15m y Refresh Token 7d).
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@vyrtium.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret123!
 *     responses:
 *       200:
 *         description: Autenticación exitosa con tokens de acceso y actualización.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Autenticación exitosa
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *       400:
 *         description: Campos requeridos faltantes o formato inválido.
 *       401:
 *         description: Credenciales inválidas.
 */
router.post('/login', validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar tokens de acceso
 *     description: Valida el Refresh Token actual, aplica rotación y emite un nuevo par de tokens.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens renovados exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tokens renovados exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Refresh token faltante o formato inválido.
 *       401:
 *         description: Refresh token inválido, expirado o revocado.
 */
router.post('/refresh', validate(refreshTokenSchema), (req, res, next) =>
  authController.refreshToken(req, res, next)
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Invalida el Refresh Token del usuario autenticado en la base de datos.
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente.
 *       401:
 *         description: Token no proporcionado o inválido.
 */
router.post('/logout', authenticateJwt, (req, res, next) =>
  authController.logout(req, res, next)
);

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: Retorna la información del usuario autenticado a partir del Access Token JWT.
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario autenticado.
 *       401:
 *         description: Token no proporcionado, inválido o expirado.
 */
router.get('/perfil', authenticateJwt, (req, res, next) =>
  authController.getProfile(req, res, next)
);

export default router;
