export type ApiResponse<T> = T;

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}
