# Q BMS v2.3.0.1 — Reporting Lines Installer Repair

## Root cause

The v2.2.14.0 patch framework wrote:

`.qbms_last_patch_backup`

at repository root after successful installation.

At the same time, Architecture Verification correctly classified root-level
patch artifacts as obsolete. Therefore v2.3.0.0 reached the Reporting Lines
migration successfully, then failed Architecture Verification and restored
runtime files.

## Repair

v2.3.0.1:

1. Removes the obsolete root `.qbms_last_patch_backup` pointer before copying runtime files.
2. Stores the new last-backup pointer at:
   `.qbms_patch_backup/.last_backup`
3. Keeps the clean-root Architecture Verification rule.
4. Re-runs the Reporting Lines migration safely; the SQL is idempotent.
5. Installs the complete v2.3.0 Reporting Lines feature set.
6. Synchronizes application/package versions to 2.3.0.1.

No manual database repair is required.
