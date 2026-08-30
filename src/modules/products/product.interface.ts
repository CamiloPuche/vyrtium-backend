export interface ProductCategoryInfo {
  id: string;
  name: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  category?: ProductCategoryInfo;
  createdAt: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProductsResponse {
  data: ProductResponse[];
  meta: PaginationMeta;
}
