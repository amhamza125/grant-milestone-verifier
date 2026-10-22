# Delivery Report — Nightly ETL Pipeline

Delivered: 2026-10-16
Pipeline: warehouse-events-etl (nightly)

## What was delivered

- A scheduled nightly job that extracts warehouse inventory and shipment
  events from the operations database.
- Transform step: events are normalized into the analytics schema
  (event id, warehouse, sku, quantity delta, timestamp).
- Load step: records are written to the analytics store with idempotent
  upserts, so a re-run never duplicates rows.

## Verification runs

- Three consecutive nightly runs completed successfully.
- Row counts reconcile with the source database for all three nights
  (difference: 0 rows).
- A failure-injection test confirmed the job alerts and retries safely.

## Result

The nightly ETL pipeline is delivered, running on schedule, and loading
warehouse events into the analytics store with reconciled counts.
