import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCategorySchema, updateCategorySchema } from './category.schema';

const router = Router();

// All category routes are private and require JWT Bearer authentication
router.use(authenticateJwt);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Crear nueva categoría
 *     description: Registra una nueva categoría de productos. Requiere autenticación JWT.
 *     tags:
 *       - Categorías
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ropa Deportiva
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente.
 *       400:
 *         description: Error de validación en los datos de entrada.
 *       401:
 *         description: No autenticado o token inválido.
 *       409:
 *         description: Ya existe una categoría con este nombre.
 */
router.post('/', validate(createCategorySchema), (req, res, next) =>
  categoryController.create(req, res, next)
);

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Listar todas las categorías activas
 *     description: Retorna la lista de categorías activas con el conteo de productos asociados.
 *     tags:
 *       - Categorías
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías activas.
 *       401:
 *         description: No autenticado o token inválido.
 */
router.get('/', (req, res, next) =>
  categoryController.findAll(req, res, next)
);

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     summary: Obtener detalle de una categoría
 *     description: Retorna los datos y conteo de productos de una categoría por su UUID.
 *     tags:
 *       - Categorías
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la categoría
 *     responses:
 *       200:
 *         description: Detalle de la categoría.
 *       401:
 *         description: No autenticado o token inválido.
 *       404:
 *         description: Categoría no encontrada.
 */
router.get('/:id', (req, res, next) =>
  categoryController.findById(req, res, next)
);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar una categoría
 *     description: Modifica el nombre de una categoría existente.
 *     tags:
 *       - Categorías
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Accesorios Fitness
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autenticado o token inválido.
 *       404:
 *         description: Categoría no encontrada.
 *       409:
 *         description: Ya existe otra categoría con este nombre.
 */
router.put('/:id', validate(updateCategorySchema), (req, res, next) =>
  categoryController.update(req, res, next)
);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     summary: Eliminar una categoría (Soft Delete)
 *     description: Marca la categoría como eliminada si no tiene productos asociados activos.
 *     tags:
 *       - Categorías
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de la categoría
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente.
 *       401:
 *         description: No autenticado o token inválido.
 *       404:
 *         description: Categoría no encontrada.
 *       409:
 *         description: No se puede eliminar la categoría porque tiene productos asociados activos.
 */
router.delete('/:id', (req, res, next) =>
  categoryController.delete(req, res, next)
);

export default router;
