# Grant Milestone Verifier — design brief

Standalone GenLayer Intelligent Contract candidate for the portal's
"standalone contracts" category (0–500 pts): a reusable primitive that
turns grant payouts into consensus-verified releases instead of trust.

Why this one: DAOs and grant programs (GenLayer's included) lock funds
and then argue about whether milestones were really met. An AI jury that
checks milestone evidence against the written milestone spec — and only
then unlocks the next tranche — is genuine judgment work for consensus,
a clean state machine, and a primitive other builders can reach for
(grants, bounties, freelance escrow). It is structurally different from
Waybill: text evidence matched against a spec, not photo classification;
multi-tranche, not one-shot; two-party (grantor/builder), not three-party.

## The deal, in plain words

1. A grantor creates a grant: names a builder, writes 1–N milestones
   (each with a plain-text spec of what "done" means and a GEN amount),
   and locks the full budget as escrow in the contract.
2. The builder submits evidence for the next open milestone (text
   summary + links/artifact hashes).
3. An AI jury (validator consensus) reads the evidence against the
   milestone spec and returns a strict verdict: MET or NOT_MET, with a
   confidence score 1–100 and short reasons.
4. MET → the milestone's tranche transfers to the builder at
   finalization; the next milestone opens. NOT_MET → escrow stays locked;
   the builder can revise and resubmit.
5. Grantor keeps an emergency pause and can cancel unclaimed future
   milestones (funds return to grantor); completed payouts never reverse.

## State machine

- PROPOSED → FUNDED (escrow locked, milestones registered)
- per milestone: OPEN → SUBMITTED → VERIFIED (tranche paid) /
  REJECTED (back to OPEN, resubmission allowed)
- grant-level: ACTIVE → COMPLETE (all milestones verified) /
  CANCELLED (grantor cancels remaining; escrow remainder refunded)
- protocol_paused: owner-only emergency stop, never auto-set

## Functions (write)

- `create_grant(builder, milestones_json, total_escrow)` — payable; validates
  milestone amounts sum to escrow; milestones ≥ 1, ≤ 20.
- `submit_evidence(grant_id, evidence_json)` — builder only (sender-bound);
  evidence: summary text + links list; one open submission per milestone.
- `assess_milestone(grant_id)` — triggers the AI jury; stores verdict.
- `release_tranche(grant_id)` — callable after a MET verdict; transfers the
  tranche to the builder; advances the milestone pointer.
- `cancel_grant(grant_id)` — grantor only; refunds unclaimed escrow.
- Owner controls: `set_paused`, `transfer_ownership`.

Functions (view): `get_grant`, `get_milestone`, `get_verdict`,
`get_protocol_overview`.

## Consensus design

- Strict verdict schema enforced in the prompt and parsed on-chain:
  `{ "milestone_id": int, "met": bool, "score": 1–100, "reasons": [str] }`.
  Malformed or out-of-range verdicts are rejected (no state change) —
  fail closed, same doctrine as push-oracle v4.
- Equivalence check on the `met` boolean (plus a score sanity band);
  reasons are recorded but not compared — judges the judgment, not the prose.
- Anti-gaming rules in the prompt: evidence must reference concrete
  deliverables named in the milestone spec; vague claims ("work done,
  trust me") must return NOT_MET; the jury may not invent criteria beyond
  the spec.
- Resubmission is unlimited but each submission is a fresh verdict; a
  NOT_MET never locks the milestone permanently (avoids griefing).

## Storage

Follow the Waybill pattern: `TreeMap[bigint, str]` grant id → JSON blob,
`TreeMap[str, str]` address → JSON list of grant ids, activity log capped
at 200 entries. Owner stored as lowercase-hex `str` (the push-oracle v4
lesson: Address params from calldata do not compare equal to
`gl.message.sender_address` — never revert to Address types).

## GenVM gotchas to carry over

- `# { "Depends": ... }` first line, imports immediately after — no comment
  block between (breaks deployment silently).
- `gl.vm.UserError` for user-facing failures, never bare `raise Exception`.
- genlayer-js transaction status: use `statusName` (camelCase); numeric
  `status` 7 = FINALIZED. `status_name` does not exist.

## Test plan (adversarial, 10+ scenarios)

1. Full happy path: 3 tranches, submit → MET → paid → next opens → grant COMPLETE; payouts verified to the wei.
2. NOT_MET: vague evidence rejected, escrow untouched, resubmission allowed.
3. Malformed jury verdict (bad JSON / score 0 / score 101) → no state change.
4. Non-builder submits evidence → rejected (sender-bound).
5. Non-grantor cancels → rejected.
6. Cancel mid-grant: completed tranches stay paid, remainder refunds grantor.
7. Milestone amounts ≠ escrow on create → rejected.
8. Double submission on same milestone while one is open → rejected.
9. Release without a MET verdict → rejected.
10. Pause gate: submissions blocked while paused, resume works.
11. Owner transfer + new owner controls verified.
12. Evidence with links but no spec coverage → NOT_MET (anti-gaming).

Deliverables (CollateralGuard playbook): contract file, runnable
`tests/adversarial/` suite (keys via env), `docs/VERIFICATION.md` with
both deployed addresses, the full tx matrix with explorer links, and
honest limitations. README in first person, specs-style, concrete numbers;
test results framed as what the contract can do + the pass/fail table.
Fresh submission = no bug-fix storytelling.
