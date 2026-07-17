# Lumio API

The API follows a small service-oriented MVC structure:

- `routes/` validates HTTP input and shapes responses.
- `services/` owns activity, credit, and progression business rules.
- `database.ts` centralizes pooled MySQL access and transactions.
- `http.ts` centralizes authentication, authorization, and errors.
- `database/schema.sql` is the normalized source-of-truth schema.
- `database/seed.sql` adds interests, badges, and the first roadmap.

Never commit `.env`. Use `.env.example` as the configuration template.

## AI configuration

The Lumi Tutor and PPT Generator call the OpenAI Responses API from the backend. Configure these only in the backend environment:

```text
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5.6-sol
```

`OPENAI_MODEL` is optional and defaults to `gpt-5.6-sol`. The API key must never use a `NEXT_PUBLIC_` name or be placed in frontend code. If the key is missing or the provider fails, the API returns an explicit error; it does not substitute mock content.
