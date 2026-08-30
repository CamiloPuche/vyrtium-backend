import { Router } from 'express';
import { productController } from './product.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from './product.schema';

const router = Router();

// Private routes require JWT Bearer authentication
router.use(authenticateJwt);

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Crear nuevo producto
 *     description: Registra un producto en el catálogo. Soporta subida de imagen binaria (multipart/form-data) o JSON directo.
 *     tags:
 *       - Productos (Privado)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Proteína Whey Isolate 2kg
 *               description:
 *                 type: string
 *                 example: Proteína de suero aislada de rápida absorción
 *               price:
 *                 type: number
 *                 example: 89.99
 *               stock:
 *                 type: integer
 *                 example: 50
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (JPEG, PNG, WEBP max 5MB)
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Creatina Monohidratada 500g
 *               description:
 *                 type: string
 *                 example: Creatina micronizada pura 100%
 *               price:
 *                 type: number
 *                 example: 34.50
 *               stock:
 *                 type: integer
 *                 example: 100
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Producto creado exitosamente.
 *       400:
 *         description: Error de validación (precio <= 0, stock < 0, formato de archivo inválido).
 *       401:
 *         description: No autenticado o token inválido.
 *       404:
 *         description: Categoría no encontrada.
 */
router.post(
  '/',
  upload.single('image'),
  validate(createProductSchema),
  (req, res, next) => productController.create(req, res, next)
);

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Listar productos (con paginación y filtros)
 *     description: Retorna el catálogo paginado de productos activos para el panel de administración.
 *     tags:
 *       - Productos (Privado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por UUID de categoría
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o descripción
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, price, stock]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Catálogo paginado de productos.
 *       401:
 *         description: No autenticado.
 */
router.get('/', (req, res, next) =>
  productController.findAll(req, res, next)
);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Detalle de un producto
 *     description: Retorna la información completa de un producto por su UUID.
 *     tags:
 *       - Productos (Privado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle del producto.
 *       401:
 *         description: No autenticado.
 *       404:
 *         description: Producto no encontrado.
 */
router.get('/:id', (req, res, next) =>
  productController.findById(req, res, next)
);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     description: Modifica los campos de un producto existente. Soporta reemplazo de imagen.
 *     tags:
 *       - Productos (Privado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               image:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente.
 *       400:
 *         description: Error de validación en los campos enviados.
 *       401:
 *         description: No autenticado.
 *       404:
 *         description: Producto o categoría no encontrada.
 */
router.put(
  '/:id',
  upload.single('image'),
  validate(updateProductSchema),
  (req, res, next) => productController.update(req, res, next)
);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto (Soft Delete)
 *     description: Marca el producto como eliminado lógicamente (`deleted_at`).
 *     tags:
 *       - Productos (Privado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente.
 *       401:
 *         description: No autenticado.
 *       404:
 *         description: Producto no encontrado.
 */
router.delete('/:id', (req, res, next) =>
  productController.delete(req, res, next)
);

export default router;
