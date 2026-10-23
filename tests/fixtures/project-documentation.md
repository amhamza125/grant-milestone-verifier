# Project Documentation — Published Repository Contents (full text)

This document is the complete published documentation: README first,
then the API reference, then the changelog.

## README

# Example Project

Grants without the argument: escrowed milestones, evidence checked
against a written spec, tranches released on a verified verdict.

### Quickstart

1. Install: `npm install example-project`
2. Configure: copy `.env.example` to `.env` and set your RPC endpoint.
3. Run: `npm start` — the service listens on port 8080.

### Layout

- `src/` — service code
- `docs/` — this documentation
- `tests/` — integration suite

Full endpoint documentation is in the API reference below; release
history is in the changelog at the end.

## API Reference (all 23 endpoints)

1. `GET /v1/grants` — list grants. Returns: array of grant objects.
2. `GET /v1/grants/{id}` — grant detail. Errors: 404 unknown id.
3. `POST /v1/grants` — create grant. Body: builder, milestones.
4. `GET /v1/grants/{id}/milestones` — milestone list for a grant.
5. `POST /v1/grants/{id}/release` — release the current tranche.
6. `POST /v1/grants/{id}/cancel` — cancel and refund unclaimed escrow.
7. `GET /v1/milestones/{id}` — milestone detail with verdict.
8. `POST /v1/milestones/{id}/evidence` — submit evidence.
9. `POST /v1/milestones/{id}/assess` — trigger jury assessment.
10. `GET /v1/activity` — recent verdict and payout activity.
11. `GET /v1/parties/{address}/grants` — grants for one party.
12. `POST /v1/auth/login` — session login. Errors: 401 bad credentials.
13. `POST /v1/auth/logout` — end session.
14. `GET /v1/users/me` — current user profile.
15. `PUT /v1/users/me` — update profile.
16. `GET /v1/projects` — list projects.
17. `POST /v1/projects` — create project.
18. `GET /v1/projects/{id}` — project detail.
19. `DELETE /v1/projects/{id}` — delete project. Errors: 403 not owner.
20. `GET /v1/reports/launch` — the launch report.
21. `GET /v1/health` — service health. Returns `{status: "ok"}`.
22. `GET /v1/metrics` — usage metrics for the deployment.
23. `POST /v1/webhooks` — register a payout webhook.

Every endpoint returns JSON; errors use `{error, code}` with the codes
shown above.

## Changelog

### v1.0.0 — 2026-10-10
- Added: full grant lifecycle API (grants, milestones, release, cancel).
- Added: evidence submission and jury assessment endpoints.
- Fixed: pagination edge case on the grants list.

### v0.2.0 — 2026-09-18
- Added: activity feed and party grant index.
- Changed: error format unified to `{error, code}`.

### v0.1.0 — 2026-09-02
- Added: initial release — auth, users, projects, health.
