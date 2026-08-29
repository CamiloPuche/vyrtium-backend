import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vyrtium_db',
  synchronize: process.env.DB_SYNCHRONIZE === 'true' || isDevelopment,
  logging: isDevelopment ? ['error', 'warn'] : ['error'],
  entities: [User, Category, Product],
  migrations: ['./src/migrations/*.ts'],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
