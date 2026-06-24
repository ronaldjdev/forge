```typescript
// src/shared/contracts/IPaginatedResponse.ts

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

```typescript
// src/shared/contracts/IResponse.ts

export interface IResponse<T> {
  data: T;
  message?: string;
}
```
