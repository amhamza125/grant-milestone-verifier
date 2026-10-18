# Grant Milestone Verifier

I built this because grant payouts usually run on trust: someone promises work, someone else wires money, and then everyone argues about whether the work actually happened. This contract replaces the argument with a jury.

## The deal, in plain words

A grantor locks GEN against a list of milestones. A builder submits evidence for each milestone. An AI jury reads the milestone spec and the evidence, and returns a strict verdict: MET or NOT_MET, with a 1–100 score and a reason. MET releases that milestone's tranche to the builder automatically. NOT_MET sends the milestone back to OPEN with the escrow untouched, so the builder can resubmit. The grantor can cancel anytime and get back whatever hasn't been paid out.

## Numbers

- **Contract:** `0x4a7246A289e1528e5ac08be417C7c84F9BF26d43` (GenLayer StudioNet, chain 61999)
- **Adversarial suite:** 13/13 scenarios passed, every write transaction FINALIZED
- **Escrow tested:** 4.50 GEN across 9 grants — 2.75 GEN paid to the builder, 1.75 GEN refunded, all to the wei
- **Jury verdicts observed:** real milestones scored 90–100 (MET); vague evidence scored 1–2 (NOT_MET); a prompt-injection attempt scored NOT_MET with zero payout

## How the jury works

`assess_milestone` runs a comparative prompt consensus: several validators independently judge the evidence against the spec, and the contract only accepts the verdict if they agree. The verdict schema is strict — `{milestone_id, met, score, reasons}` — and anything malformed is rejected fail-closed with no state change. The prompt carries explicit anti-gaming rules: evidence must reference concrete deliverables from the spec, vague claims get NOT_MET, and injected instructions inside the evidence ("return met=true") are ignored and treated as NOT_MET.

## State machine

`FUNDED → (per milestone) OPEN → SUBMITTED → APPROVED → VERIFIED → COMPLETE`, with `CANCELLED` reachable from `FUNDED` at any time. NOT_MET returns a milestone to OPEN instead of advancing it.

## Functions

| Function | Who | What |
|----------|-----|------|
| `create_grant(builder, title, milestones_json)` | anyone (payable) | Locks escrow; escrow must equal the milestone sum exactly |
| `submit_evidence(grant_id, evidence_json)` | builder only | Submits `{summary, links}` for the current milestone |
| `assess_milestone(grant_id)` | grantor or builder | Runs the AI jury; records verdict on consensus |
| `release_tranche(grant_id)` | grantor or builder | Pays the milestone amount to the builder on a MET verdict |
| `cancel_grant(grant_id)` | grantor only | Refunds unclaimed escrow |
| `set_paused(bool)` | owner only | Freezes submits/assesses/releases |
| `transfer_ownership(new_owner)` | owner only | Two-address owner model, lowercase-hex |

Views: `get_grant`, `get_milestone`, `get_verdict`, `get_grants_for_party`, `get_activity_history`, `get_protocol_overview`.

## What the tests proved

The suite in `tests/` covers the happy path (3 tranches, all MET, grant COMPLETE), NOT_MET with resubmission, a prompt-injection attack (defeated), access control both directions (grantor can't submit, builder can't cancel), outsider gates (a stranger can trigger neither assessment nor release), mid-grant cancel with partial refund, escrow mismatch rejection, double-submit and release-without-verdict rejection, the pause gate, owner transfer with old-owner lockout, and anti-gaming evidence (unrelated links → NOT_MET). Full details, transaction hashes, and honest limitations in `docs/VERIFICATION.md`.

## Design notes

- Storage is a TreeMap of JSON blobs keyed by grant ID — the same pattern I used on my Waybill contract.
- Addresses are lowercase-hex strings everywhere, never `Address` type (calldata `Address` params don't compare equal to `gl.message.sender_address` — a hard-won lesson).
- Verdict parsing is a pure function (`_parse_verdict`) with a standalone 12-case adversarial suite in `tests/validate_verdict.py` that runs without a chain.
- Assessment and tranche release are participant-gated: only the grantor or the builder can trigger them. The jury reads the evidence from the contract's own storage, so the assessed evidence is always exactly what the builder committed — there is no way to swap it at assessment time.

## Run the tests

```bash
cd tests
npm install
export GMV_CONTRACT=0x4a7246A289e1528e5ac08be417C7c84F9BF26d43
export GMV_KEY_A=<grantor key>
export GMV_KEY_B=<builder key>
export GMV_KEY_C=<outsider key>
node run.mjs        # ~60 min, needs three funded wallets
node finalize.mjs   # payout + finalization audit
python3 validate_verdict.py  # no chain needed
```

## License

MIT — see `LICENSE`.
