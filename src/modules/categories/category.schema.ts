import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la categoría es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la categoría es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid('El ID de la categoría debe ser un UUID válido'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
