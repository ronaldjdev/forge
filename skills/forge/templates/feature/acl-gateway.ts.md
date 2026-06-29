```typescript
// src/features/<domain>/adapters/out/legacy-<system>/<Domain>Gateway.ts
import { injectable } from "tsyringe";
import type { External<Domain>DTO } from "./External<Domain>DTO.js";

@injectable()
export class <Domain>Gateway {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.LEGACY_<SYSTEM>_URL ?? "";
  }

  async fetch(id: string): Promise<External<Domain>DTO | null> {
    const response = await fetch(`${this.baseUrl}/api/${id}`, {
      headers: { Authorization: `Bearer ${this.getApiKey()}` },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Legacy error: ${response.statusText}`);
    return response.json();
  }

  async upsert(dto: External<Domain>DTO): Promise<External<Domain>DTO> {
    const response = await fetch(`${this.baseUrl}/api`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify(dto),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Legacy error: ${response.statusText}`);
    return response.json();
  }

  async remove(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.getApiKey()}` },
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Legacy error: ${response.statusText}`);
    }
  }

  private getApiKey(): string {
    return process.env.LEGACY_<SYSTEM>_API_KEY ?? "";
  }
}
```
