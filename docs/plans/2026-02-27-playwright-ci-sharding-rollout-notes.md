# Playwright CI Sharding Rollout Notes

## Failure interpretation
- If one shard fails, only that matrix leg is red (`Playwright parallel shard X/4`).
- `playwright_report_merge` still runs and publishes merged HTML report.
- Overall PR check fails when any shard or serial job fails.

## Artifact naming
- `playwright-results-shard-1`
- `playwright-results-shard-2`
- `playwright-results-shard-3`
- `playwright-results-shard-4`
- `playwright-results-serial`
- `playwright-report` (final merged report)

## Manual re-run of one shard locally
Run from repo root:

```bash
./deploy-scripts/run-playwright-parallel-shard.sh 3 4
```

This runs shard 3/4 of `parallel_tests` with `--workers 1`.

## Criteria to port same model to build workflow
Port the same job model to `.github/workflows/build.yml` when all are true:
- At least 10 recent PR runs show stable shard execution.
- No recurring shard-specific flakes caused by CI resource contention.
- Median PR Playwright duration is materially lower than pre-sharding baseline.
- Merged report quality is sufficient for debugging without re-running whole suite.
