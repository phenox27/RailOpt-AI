# Task R2-2 — API Routes and Backend Logic

## Agent: backend-developer

## Summary
Built all 11 API route files (13 endpoints) for the RailOpt AI application, including full CRUD operations, workflow-enforced status transitions, AI-powered priority scoring and optimization, and automatic audit logging.

## Files Created
- `src/app/api/seed/route.ts` — POST: Seed database (idempotent)
- `src/app/api/maintenance/route.ts` — GET (list + filters) + POST (create + validate)
- `src/app/api/maintenance/[id]/route.ts` — GET + PATCH + DELETE (pending only)
- `src/app/api/blocks/route.ts` — GET (list + filters) + POST (create + MR linking)
- `src/app/api/blocks/[id]/route.ts` — GET + PATCH (approval workflow)
- `src/app/api/plans/route.ts` — GET (list + blocks) + POST (create)
- `src/app/api/plans/[id]/route.ts` — GET (with stats) + PATCH (status transitions)
- `src/app/api/conflicts/route.ts` — GET (list + filters) + PATCH (resolve)
- `src/app/api/conflicts/[id]/route.ts` — GET + PATCH (resolve)
- `src/app/api/audit/route.ts` — GET (pagination + filters) + POST (create)
- `src/app/api/priority-score/route.ts` — POST (AI scoring with LLM + heuristic fallback)
- `src/app/api/optimization/route.ts` — POST (AI optimization, full or SSE streaming)
- `src/lib/llm.ts` — Shared LLM utility (callLLM + callLLMStream)

## Files Modified
- `src/app/api/route.ts` — Updated to API index listing all endpoints
- `src/components/railopt/sync-indicator.tsx` — Fixed lint error (setState-in-effect)

## Database Seeded
- 9 users, 12 maintenance requests, 5 blocks, 2 plans, 5 conflicts, 8 audit logs

## Key Design Decisions
- Status transitions enforced at API level (prevents invalid workflow jumps)
- Audit logs auto-created on status changes
- AI Priority Scoring falls back to heuristic when LLM unavailable
- Optimization supports both full JSON response and SSE streaming
- Seed is idempotent (safe to call multiple times)
