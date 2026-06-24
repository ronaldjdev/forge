```typescript
// src/shared/types/api.types.ts

export type SortOrder = "asc" | "desc";

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```
