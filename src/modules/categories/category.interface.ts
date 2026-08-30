export interface CategoryResponse {
  id: string;
  name: string;
  createdAt: Date;
  productsCount?: number;
}

export interface CategoryDetailResponse {
  id: string;
  name: string;
  createdAt: Date;
  productsCount: number;
}
