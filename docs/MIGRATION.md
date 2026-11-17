# Legacy data migration

The legacy database exporter is available as `npm run export:legacy`. It reads `LEGACY_DB_URL`, issues `SELECT *` against the six known legacy tables, tolerates a missing table, and writes `migration-export/legacy-export.json`. The export may contain customer personal information and password hashes; keep it outside source control and delete it after migration. Password hashes must never be imported into Convex Auth.

## Export

1. Take and verify a MySQL backup before starting.
2. Set `LEGACY_DB_URL` in the shell that runs the export. Use a read-only DB account.
3. Run `npm run export:legacy` and inspect row counts and the JSON before proceeding.
4. Make a second protected copy of the export and confirm that `migration-export/` is git-ignored.

## Mapping rules

`convex/lib/legacyMapping.ts` implements the pure mappings used to prepare an import: `pending_booking` becomes `requested`; `pending` becomes `received` when kilos exists and otherwise `approved`; service keys and the two pickup windows are normalized; peso values are converted to integer centavos. Other listed order statuses remain unchanged.

## Import status

The Convex batch importer, file transfer, user reset-email action, post-import day-count rebuild, and automated rollback command are not implemented yet. Do not point this export at production data expecting it to import automatically. Before go-live, finish an importer that records each legacy row in `legacyMap`, run it on a disposable deployment with `dryRun`, compare table counts and totals, then import in batches and verify sample profiles, orders, proof files, and timers.

## Rollback plan

An importer must retain every created Convex ID in `legacyMap`. To roll back, stop new bookings, export the mapping table, delete imported documents and storage objects by their recorded IDs in bounded batches, then remove the map entries. Keep the original MySQL database read-only until verification is accepted. Because the importer is currently absent, there is no safe automated rollback command yet.
