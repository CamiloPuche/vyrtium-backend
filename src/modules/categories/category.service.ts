import { ILike, Not } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Category } from '../../entities/Category';
import { Product } from '../../entities/Product';
import { AppError } from '../../errors/AppError';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';
import { CategoryResponse, CategoryDetailResponse } from './category.interface';

export class CategoryService {
  private categoryRepository = AppDataSource.getRepository(Category);
  private productRepository = AppDataSource.getRepository(Product);

  async create(input: CreateCategoryInput): Promise<CategoryResponse> {
    const trimmedName = input.name.trim();

    const existingCategory = await this.categoryRepository.findOne({
      where: { name: ILike(trimmedName) },
    });

    if (existingCategory) {
      throw new AppError(409, 'Ya existe una categoría con este nombre');
    }

    const category = this.categoryRepository.create({
      name: trimmedName,
    });

    const savedCategory = await this.categoryRepository.save(category);

    return {
      id: savedCategory.id,
      name: savedCategory.name,
      createdAt: savedCategory.createdAt,
      productsCount: 0,
    };
  }

  async findAll(): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .loadRelationCountAndMap(
        'category.productsCount',
        'category.products',
        'product',
        (qb) => qb.where('product.deleted_at IS NULL')
      )
      .orderBy('category.createdAt', 'DESC')
      .getMany();

    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      createdAt: cat.createdAt,
      productsCount: Number(cat.productsCount ?? 0),
    }));
  }

  async findById(id: string): Promise<CategoryDetailResponse> {
    const category: any = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.id = :id', { id })
      .loadRelationCountAndMap(
        'category.productsCount',
        'category.products',
        'product',
        (qb) => qb.where('product.deleted_at IS NULL')
      )
      .getOne();

    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      productsCount: Number(category.productsCount ?? 0),
    };
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryResponse> {
    const trimmedName = input.name.trim();

    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    const duplicateCategory = await this.categoryRepository.findOne({
      where: {
        name: ILike(trimmedName),
        id: Not(id),
      },
    });

    if (duplicateCategory) {
      throw new AppError(409, 'Ya existe otra categoría con este nombre');
    }

    category.name = trimmedName;
    const updatedCategory = await this.categoryRepository.save(category);

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      createdAt: updatedCategory.createdAt,
    };
  }

  async delete(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    const activeProductsCount = await this.productRepository.count({
      where: { categoryId: id },
    });

    if (activeProductsCount > 0) {
      throw new AppError(
        409,
        `No se puede eliminar la categoría porque tiene ${activeProductsCount} producto(s) asociado(s)`
      );
    }

    await this.categoryRepository.softDelete(id);
  }
}

export const categoryService = new CategoryService();
