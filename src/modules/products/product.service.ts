import { AppDataSource } from '../../config/database';
import { Product } from '../../entities/Product';
import { Category } from '../../entities/Category';
import { AppError } from '../../errors/AppError';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from './product.schema';
import {
  ProductResponse,
  PaginatedProductsResponse,
} from './product.interface';

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);
  private categoryRepository = AppDataSource.getRepository(Category);

  private mapToResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      category: product.category
        ? { id: product.category.id, name: product.category.name }
        : undefined,
      createdAt: product.createdAt,
    };
  }

  async create(
    input: CreateProductInput,
    imageBuffer?: Buffer
  ): Promise<ProductResponse> {
    const category = await this.categoryRepository.findOne({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new AppError(404, 'La categoría especificada no existe');
    }

    let finalImageUrl = input.imageUrl ?? null;

    if (imageBuffer) {
      finalImageUrl = await uploadImageToCloudinary(imageBuffer);
    }

    const product = this.productRepository.create({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      stock: input.stock,
      imageUrl: finalImageUrl,
      categoryId: input.categoryId,
    });

    const savedProduct = await this.productRepository.save(product);
    savedProduct.category = category;

    return this.mapToResponse(savedProduct);
  }

  async findAll(query: ProductQueryInput): Promise<PaginatedProductsResponse> {
    const { page, limit, categoryId, search, sortBy, sortOrder } = query;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const sortColumn = `product.${sortBy}`;
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(sortColumn, orderDirection);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products.map((p) => this.mapToResponse(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<ProductResponse> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new AppError(404, 'Producto no encontrado');
    }

    return this.mapToResponse(product);
  }

  async update(
    id: string,
    input: UpdateProductInput,
    imageBuffer?: Buffer
  ): Promise<ProductResponse> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new AppError(404, 'Producto no encontrado');
    }

    if (input.categoryId && input.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new AppError(404, 'La categoría especificada no existe');
      }

      product.categoryId = input.categoryId;
      product.category = category;
    }

    if (imageBuffer) {
      product.imageUrl = await uploadImageToCloudinary(imageBuffer);
    } else if (input.imageUrl !== undefined) {
      product.imageUrl = input.imageUrl;
    }

    if (input.name !== undefined) product.name = input.name.trim();
    if (input.description !== undefined) product.description = input.description?.trim() || null;
    if (input.price !== undefined) product.price = input.price;
    if (input.stock !== undefined) product.stock = input.stock;

    const updatedProduct = await this.productRepository.save(product);

    return this.mapToResponse(updatedProduct);
  }

  async delete(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new AppError(404, 'Producto no encontrado');
    }

    await this.productRepository.softDelete(id);
  }
}

export const productService = new ProductService();
