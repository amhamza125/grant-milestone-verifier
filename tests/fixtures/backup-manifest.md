# Offsite Backup Manifest — Signed

Manifest date: 2026-10-15
Backup set: production database + file store

## Contents

- db-full-2026-10-15.dump.gz — SHA-256 recorded in the ops log
- files-2026-10-15.tar.gz — user uploads and generated reports
- config snapshot — environment and secrets references (values redacted)

## Verification

- Restore drill completed on a clean host: database restored and the
  application booted against it successfully.
- Checksums verified after transfer to the offsite location.

Signed: Ops (builder team)
