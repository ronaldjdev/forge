```typescript
// src/shared/utils/formatDate.ts

export function formatDate(date: Date, locale = "es-ES"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
```

```typescript
// src/shared/utils/pagination.ts
import type { PaginationQuery } from "../types/api.types.js";

export function buildPagination(query: PaginationQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
```
