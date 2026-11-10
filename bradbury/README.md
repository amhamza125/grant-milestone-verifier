# GMV on Bradbury Phase 2

This folder holds the Bradbury Phase 2 port of the Grant Milestone Verifier.
The accepted StudioNet source lives at the repository root
(`GrantMilestoneVerifier.py`); this is the same grant logic ported to
GenVM v0.3.0-rc10.

## Deployment

| | |
|---|---|
| Contract | GMV v2.2, `0x539133B55522bD3f461F36bcA27Cf1bA9A25F5D8` |
| Network | Bradbury Phase 2, chain 4221 |
| Deploy tx | `0x2431284467e3eee495010ac58a394b71aa854a738a96392eff6e3e96393562a9` |
| Source | `GrantMilestoneVerifier.bradbury.v2.2.py` (SHA-256 `00768c91b4ce5a3cebc98527694c00b1f9b35d9c9aeb89b5e0df6041bfc4a96d`) |
| Explorer | https://explorer-bradbury.genlayer.com/address/0x539133B55522bD3f461F36bcA27Cf1bA9A25F5D8 |

## What changed for Bradbury

The port keeps every steward property of the accepted contract verbatim
(permission-gated writes, SHA-256 evidence binding with fail-closed
behaviour, string TreeMap keys, strict MET / NOT_MET verdicts with grounding
receipts, non-payable `create_grant` + payable `fund_grant` with full inline
refund). Two things are specific to this deployment:

- **Jury agreement via `strict_eq`** — the jury returns a canonical JSON
  string and validators agree on it exactly; score is null (per-validator
  scores cannot be byte-identical).
- **Payout via the documented Faucet pattern** — an empty EVM contract
  interface (`_Recipient`) and
  `_Recipient(Address(recipient)).emit_transfer(value=amount)`. Every
  payout-class transaction attaches the proven external message allocation
  (payee recipient, zero call key, budget 0.0012 GEN — exactly 20x gas limit
  x max gas price).

## Verification (Bradbury, live)

Full lifecycle, block 266153: 12 of 12 steps FINALIZED with
FINISHED_WITH_RETURN; 7 of 7 negative tests passed. Grant 0 verdict met =
true, grounding SHA `48d2727a…` byte-identical to the fetched artifact.
Release paid the builder exactly 0.01 GEN (tx `0x4572396d…`); malformed-fund,
outsider-fund and cancel refunds all landed in full; nothing stranded.

Scope, stated plainly: this is the targeted lifecycle proof, not the full
28-step suite (s12/s13/G1–G4 unclaimed on this deployment).

## Front end

The GrantFlow dApp is a separate project:
https://github.com/amhamza125/grantflow — live at
https://grantflow-ameer-hamza-s-projects2.vercel.app/
