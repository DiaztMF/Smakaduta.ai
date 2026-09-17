# Smakaduta.ai

An AI-powered institutional assistant and Retrieval-Augmented Generation (RAG) platform tailored for SMK Negeri 2 Surakarta, providing automated PPDB admissions support and academic guidance.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange)](https://orm.drizzle.team/)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-green)](https://neon.tech/)

## Installation

Clone the repository and install dependencies using pnpm:

```bash
git clone https://github.com/DiaztMF/Smakaduta.ai.git
cd Smakaduta.ai
pnpm install
```

## Quick Start

1. Set up your environment variables in `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key"
```

2. Initialize database schema and start the local development server:

```bash
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the chatbot interface.

## What is Smakaduta.ai?

`Smakaduta.ai` is a specialized institutional web platform developed for SMKN 2 Surakarta (Stemsa). It addresses high-volume inquiries during the Student Admission Selection (PPDB) cycle and serves as an interactive curriculum assistant via RAG. Prospective students and guardians receive authoritative school guidelines, major competencies, and admissions schedules instantly.

## Why Smakaduta.ai?

Manual admissions counseling via WhatsApp groups and walk-in desks overwhelms school administrative staff with repetitive inquiries. `Smakaduta.ai` grounds answers strictly in official school regulatory documents, eliminating hallucinations while providing 24/7 self-service support.

## API / Routes

### Route Handlers
- `POST /api/chat`: Ingests user questions, queries semantic context from school documents, and streams generated responses.
- `GET /api/faq`: Retrieves curated, high-frequency question clusters for rapid access.

## Examples

Querying the school knowledge base via the conversational API:

```typescript
export async function sendStudentInquiry(message: string, history: Array<{ role: string; content: string }>) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve answer from Smakaduta AI assistant');
  }

  return await response.json();
}
```

## Architecture & Development Guides

- Frontend Shell: Next.js 15 App Router with React 19, Tailwind CSS, and shadcn/ui.
- RAG & Document Store: Vector search over official SMKN 2 Surakarta policy PDFs and documentation.
- Database: Drizzle ORM connecting to Neon Serverless Postgres.
- AI Gateway: Google Gemini API integration with strict system guardrails for educational compliance.

## License

MIT License. See [LICENSE](LICENSE) for full details.