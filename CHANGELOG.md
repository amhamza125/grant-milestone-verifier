# Changelog

All notable changes to this project are documented here. The format follows
Keep a Changelog, and versioning follows SemVer.

## [Unreleased]

### Added
- Evidence grounding in `assess_milestone`: the jury call fetches the
  builder's evidence links itself (`gl.nondet.web.get` with response-body
  unwrap) and the verdict is judged on the fetched artifact content
  (datamarked, UNTRUSTED-labeled, head+tail excerpts, prompt hygiene), not on
  the builder's summary — the summary is only the claim being checked.
- Fail-closed evidence acquisition: no links, or an unreachable/empty
  material link → `EVIDENCE_MISSING` / `EVIDENCE_UNREACHABLE` recorded on the
  milestone (failure count + code), milestone returned to OPEN for
  resubmission, no verdict issued, no release possible.
- Grounding receipt on every verdict: `{artifacts_fetched, primary_sha256}`
  stored with the verdict and on assessment log entries.
- 4 new suite scenarios (G1–G4): grounded MET with wei-exact 0.5 GEN release,
  contradicting-artifact NOT_MET with zero release, unreachable-link fail
  closed + successful re-assessment, outsider gates on a grounded verdict.
  Suite: 20/22 steps passed on rehearsal deployment
  `0xA8A6A83FA71B59dd6C66f9Be3E1Ae8bffb947e28`; production deployment
  `0x1d4C89b81D4D02DB2eCDB6A39EE8D561799af19a` (byte-identical source,
  2026-10-23).

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
- `tests/`: runnable end-to-end suite (`run.mjs`, 13 scenarios) plus
  finalization + exact-payout verifier (`finalize.mjs`); local adversarial
  harness for the verdict parser (`validate_verdict.py`, 12/12); keys via
  environment only.
- `docs/VERIFICATION.md`: contract specs, 13/13 pass table, explorer-linked
  transaction hashes, payout verification to the wei, honest limitations.

### Verified
- Deployed and tested on GenLayer StudioNet (chain 61999).
- Deployment: `0x4a7246A289e1528e5ac08be417C7c84F9BF26d43`
  (https://explorer-studio.genlayer.com/address/0x4a7246A289e1528e5ac08be417C7c84F9BF26d43)
- 13/13 scenarios passed; payout transactions FINALIZED; builder payouts
  verified to the wei against on-chain grant records.
