```typescript
// src/infra/mail/Mail.config.ts

export interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function loadMailConfig(): MailConfig {
  return {
    host: process.env.MAIL_HOST || "smtp.example.com",
    port: parseInt(process.env.MAIL_PORT || "587", 10),
    user: process.env.MAIL_USER || "",
    pass: process.env.MAIL_PASS || "",
    from: process.env.MAIL_FROM || "noreply@example.com",
  };
}
```

```typescript
// src/infra/mail/Mail.service.ts
import { loadMailConfig } from "./Mail.config.js";

export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  const config = loadMailConfig();
  // implementar con nodemailer, sendgrid, etc.
}
```
