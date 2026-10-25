# Grant Milestone Verifier test suite

Runnable end-to-end verification for the Grant Milestone Verifier intelligent
contract. It runs against a live StudioNet deployment and exercises the full
grant lifecycle with three wallets: two-phase grant creation and funding,
escrowed multi-tranche grants, milestone evidence, the AI jury, tranche
releases, cancellation with refunds, the pause gate, owner transfer, and
adversarial cases (prompt injection, sender-bound access control, outsider
assessment/release gates, malformed creation input, mismatched and
non-grantor funding attempts that must refund in full, double submission,
anti-gaming).

The contract fetches milestone evidence itself at assessment time, so the
suite's evidence links point at real hosted artifacts: the files in
`tests/fixtures/` in this repo, served over `raw.githubusercontent.com`.
Scenarios G1–G4 cover the grounding design directly — a fetched artifact that
supports the claim (MET, with the verdict recording the artifact's SHA-256),
a fetched artifact that contradicts the builder's summary (NOT_MET), an
unreachable evidence link (assessment fails closed with EVIDENCE_UNREACHABLE,
no verdict, no release, milestone re-opened), and the outsider gates on a
grounded grant.

## Run it

```bash
cd tests
GMV_CONTRACT=0xYourContract \
GMV_KEY_A=0xGrantorPrivateKey \
GMV_KEY_B=0xBuilderPrivateKey \
GMV_KEY_C=0xOutsiderPrivateKey \
node run.mjs
node finalize.mjs
```

- `GMV_CONTRACT` — the deployment to test. Defaults to the StudioNet
  deployment documented in `docs/VERIFICATION.md`.
- `GMV_KEY_A` — grantor wallet (deploys, creates grants, locks escrow, owns
  the pause switch).
- `GMV_KEY_B` — builder wallet (submits evidence, receives tranche payouts).
- `GMV_KEY_C` — outsider wallet (not a party to any grant; proves the
  assessment/release gates reject strangers).
- Keys go through environment variables only. Nothing with a private key is
  committed to this repo, ever.
- The suite expects a **fresh** deployment (grant ids start at 0).

`run.mjs` writes `results/results.json` (28 steps + every tx hash) and a
human-readable `results/test-log.txt`. `finalize.mjs` waits for the payout
transactions to reach FINALIZED and checks every wei moved exactly as the
contract recorded — ending with an expected contract balance of exactly
zero — writing `results/finalize.json`.

`validate_verdict.py` is a local harness that runs the contract's real
`_parse_verdict` function (imported from `GrantMilestoneVerifier.py` with a
stubbed `genlayer` module) against malformed jury outputs — bad JSON, missing
or non-boolean `met`, out-of-range scores, wrong milestone ids. All must raise.

The `results/` folder also holds the recorded run from the StudioNet
deployment: `results.json`, `finalize.json`, and `test-log.txt`. Re-running
the suite overwrites them with fresh results.
