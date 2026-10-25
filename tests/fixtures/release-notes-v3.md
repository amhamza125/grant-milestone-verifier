# Release Notes — v3

Published: 2026-10-16
Version: v3 (production)

## Features in v3

Every feature shipped in v3 is listed below.

1. Milestone detail view — a dedicated page per milestone showing the
   spec, the submitted evidence links, the jury verdict with score and
   reasons, and the paid amount.
2. Payout history — a per-grant ledger of every tranche release and
   every cancellation refund, with amounts in wei and transaction links.
3. Evidence preview — the builder's linked artifacts render inline on the
   milestone page before submission, so a broken link is visible early.
4. Grant search — grants can now be filtered by grantor, builder, and
   status (funded, complete, cancelled).

## Fixes in v3

Every fix shipped in v3 is listed below.

1. Fixed the grants list showing stale milestone counts after a
   cancellation (the count now refreshes on every load).
2. Fixed the payout history rounding display: amounts now render to the
   full wei value instead of truncating to 4 decimals.
3. Fixed the evidence preview failing on links longer than 200
   characters (the preview now handles arbitrary URL lengths).

## Result

The v3 release notes above list every feature (4) and every fix (3)
shipped in v3, with nothing held back.
