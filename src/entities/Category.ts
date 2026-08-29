import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from './Product';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
