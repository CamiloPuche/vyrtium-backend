import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del producto es obligatorio')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  description: z
    .string()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional()
    .nullable(),
  price: z.coerce
    .number({ message: 'El precio debe ser un valor numérico' })
    .positive('El precio debe ser mayor a 0')
    .max(99999999.99, 'El precio no puede exceder $99.999.999 COP'),
  stock: z.coerce
    .number({ message: 'El stock debe ser un valor numérico entero' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(1000000, 'El stock no puede exceder 1.000.000 unidades'),
  categoryId: z.string().uuid('El categoryId debe ser un UUID válido'),
  imageUrl: z.string().url('La URL de la imagen debe ser válida').optional().nullable(),
});

export const updateProductSchema = z.preprocess((obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== '' && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}, createProductSchema.partial());

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  categoryId: z.string().uuid('El categoryId debe ser un UUID válido').optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'name', 'price', 'stock']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).default('DESC'),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid('El ID del producto debe ser un UUID válido'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
