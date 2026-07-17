# Lumio API

The API follows a small service-oriented MVC structure:

- `routes/` validates HTTP input and shapes responses.
- `services/` owns activity, credit, and progression business rules.
- `database.ts` centralizes pooled MySQL access and transactions.
- `http.ts` centralizes authentication, authorization, and errors.
- `database/schema.sql` is the normalized source-of-truth schema.
- `database/seed.sql` adds interests, badges, and the first roadmap.

Never commit `.env`. Use `.env.example` as the configuration template.
