import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { logger } from '../utils/logger';

interface CategorySeedData {
  name: string;
  products: Array<{
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
  }>;
}

const SEED_DATA: CategorySeedData[] = [
  {
    name: 'Suplementos Deportivos',
    products: [
      {
        name: 'Proteína Whey Isolate 2kg - Chocolate Suizo',
        description:
          'Proteína de suero aislada de máxima pureza, 27g de proteína por porción, cero grasas y rápida absorción.',
        price: 249900,
        stock: 45,
        imageUrl:
          'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Creatina Monohidratada Micronizada 500g',
        description:
          'Creatina 100% puraCreapure sin sabor, ideal para incremento de fuerza y volumen muscular.',
        price: 135000,
        stock: 60,
        imageUrl:
          'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Pre-Workout Energy Burst 300g - Blue Raspberry',
        description:
          'Fórmula avanzada con beta-alanina, citrulina y cafeína natural para entrenamientos de alta intensidad.',
        price: 119900,
        stock: 30,
        imageUrl:
          'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    name: 'Ropa Deportiva',
    products: [
      {
        name: 'Camiseta Dry-Fit Performance Pro',
        description:
          'Camiseta técnica transpirable con tecnología anti-olor y corte ergonómico de alta movilidad.',
        price: 69900,
        stock: 50,
        imageUrl:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Shorts de Entrenamiento con Malla Interna',
        description:
          'Shorts ligeros con forro de compresión integrado, bolsillo para smartphone y cintura elástica.',
        price: 79900,
        stock: 40,
        imageUrl:
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    name: 'Accesorios Fitness',
    products: [
      {
        name: 'Set de Bandas de Resistencia (5 Niveles)',
        description:
          'Bandas de látex natural de alta durabilidad con agarres acolchados, anclaje de puerta y bolsa de transporte.',
        price: 49900,
        stock: 75,
        imageUrl:
          'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Shaker Térmico de Acero Inoxidable 750ml',
        description:
          'Vaso mezclador térmico antigoteo con rejilla homogenizadora, mantiene bebidas frías por 24 horas.',
        price: 54900,
        stock: 80,
        imageUrl:
          'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    name: 'Nutrición & Snacks',
    products: [
      {
        name: 'Caja de Barras de Proteína (12 uds) - Caramelo & Maní',
        description:
          'Barras energéticas con 20g de proteína y solo 1g de azúcar, snack perfecto post-entrenamiento.',
        price: 85000,
        stock: 35,
        imageUrl:
          'https://images.unsplash.com/photo-1622484216802-f8c5417df4eb?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
];

export async function runSeeder(): Promise<void> {
  try {
    logger.info('Iniciando proceso de inicialización de datos en COP (Seeder)...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const categoryRepository = AppDataSource.getRepository(Category);
    const productRepository = AppDataSource.getRepository(Product);

    let createdCategoriesCount = 0;
    let createdProductsCount = 0;

    for (const catData of SEED_DATA) {
      // 1. Buscar o crear la categoría (idempotente)
      let category = await categoryRepository.findOne({
        where: { name: catData.name },
      });

      if (!category) {
        category = categoryRepository.create({
          name: catData.name,
        });
        category = await categoryRepository.save(category);
        createdCategoriesCount++;
        logger.info({ category: category.name }, 'Categoría creada exitosamente');
      }

      // 2. Buscar o crear los productos de la categoría
      for (const prodData of catData.products) {
        const existingProduct = await productRepository.findOne({
          where: { name: prodData.name, categoryId: category.id },
        });

        if (!existingProduct) {
          const product = productRepository.create({
            name: prodData.name,
            description: prodData.description,
            price: prodData.price,
            stock: prodData.stock,
            imageUrl: prodData.imageUrl,
            categoryId: category.id,
          });

          await productRepository.save(product);
          createdProductsCount++;
          logger.info(
            {
              product: prodData.name,
              category: category.name,
              priceCOP: prodData.price,
            },
            'Producto creado exitosamente'
          );
        }
      }
    }

    logger.info(
      {
        createdCategories: createdCategoriesCount,
        createdProducts: createdProductsCount,
      },
      'Proceso de Seeder completado exitosamente.'
    );
  } catch (error) {
    logger.error({ err: error }, 'Fallo en la ejecución del Seeder');
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Direct execution via CLI
if (require.main === module) {
  runSeeder()
    .then(() => {
      logger.info('Seeders ejecutados con éxito. Conexión cerrada.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Error fatal durante el sembrado de datos');
      process.exit(1);
    });
}
