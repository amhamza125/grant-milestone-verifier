# Changelog

All notable changes to this project are documented here. The format follows
Keep a Changelog, and versioning follows SemVer.

## [Unreleased]

## [1.0.0] - 2026-10-18

### Added
- `GrantMilestoneVerifier.py`: GenLayer intelligent contract that turns grant
  payouts into consensus-verified releases. Grantor locks real GEN escrow for
  1-20 milestones via payable `create_grant` (milestone amounts must sum to
  the sent escrow); builder submits text evidence + links via sender-bound
  `submit_evidence`; validator AI jury checks evidence against the written
  milestone spec in `assess_milestone` and returns a strict MET / NOT_MET
  verdict (boolean + 1-100 score + reasons); `release_tranche` pays the
  milestone amount to the builder after a MET verdict and advances to the
  next milestone; NOT_MET returns the milestone to OPEN for resubmission
  (never locks permanently); grantor `cancel_grant` refunds unclaimed escrow
  (completed tranches stay paid); owner `set_paused` emergency stop with
  fail-closed submissions/assessments; `transfer_ownership`; full grant,
  milestone, verdict, and activity history views.
- Strict verdict-schema validation (`_parse_verdict`): malformed jury output
  (non-JSON, non-boolean `met`, out-of-range score, wrong milestone id)
  raises a fail-closed error -- state unchanged, no payout. Anti-gaming jury
  rules: evidence must reference concrete deliverables from the spec, vague
  claims return NOT_MET, injected instructions in evidence are ignored.
- `tests/`: runnable end-to-end suite (`run.mjs`, 12 scenarios) plus
  finalization + exact-payout verifier (`finalize.mjs`); local adversarial
  harness for the verdict parser (`validate_verdict.py`, 12/12); keys via
  environment only.
- `docs/VERIFICATION.md`: contract specs, 12/12 pass table, explorer-linked
  transaction hashes, payout verification to the wei, honest limitations.

### Verified
- Deployed and tested on GenLayer StudioNet (chain 61999).
- Deployment: `0xE89975735475F3b06B33cc89A331D82153446964`
  (https://explorer-studio.genlayer.com/address/0xE89975735475F3b06B33cc89A331D82153446964)
- 12/12 scenarios passed; payout transactions FINALIZED; builder payouts
  verified to the wei against on-chain grant records.
