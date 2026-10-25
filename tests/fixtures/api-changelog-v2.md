# API Changelog — v2

Published: 2026-10-16
Version: API v2 (production)

## Endpoint changes in v2

Every endpoint change shipped in v2 is listed below, with the before and
after behaviour for each.

1. `GET /v1/grants` — unchanged from v1.2. Still returns the paginated
   grants list, 25 items per page, ordered by creation date descending.
2. `GET /v1/grants/{id}` — response now includes the `milestones` array
   inline (v1.2 required a second call to `/milestones`). No fields were
   removed; `status`, `grantor`, `builder`, and `total_escrow_wei` are
   unchanged.
3. `POST /v1/grants` — now accepts the optional `title` field (max 120
   characters). Requests without `title` still succeed, as in v1.2.
4. `GET /v1/grants/{id}/milestones` — new in v2. Returns the milestone
   list for one grant, including each milestone's `spec`, `amount_wei`,
   `status`, and `paid_wei`.
5. `POST /v1/grants/{id}/release` — unchanged from v1.2, except the
   success response now includes `paid_wei` for the released tranche.
6. `DELETE /v1/grants/{id}` — new in v2. Cancels an unfunded or funded
   grant; the response reports the refunded amount in wei.

## Result

The v2 changelog above covers every endpoint change in v2: two new
endpoints, two changed responses, and two unchanged endpoints confirmed
as unchanged.
