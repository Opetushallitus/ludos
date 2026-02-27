# Playwright CI Sharding Design (PR Validation)

## Scope
Implement Playwright sharding for pull request validation in GitHub Actions using a fixed shard count of 4.

## Goals
- Reduce PR validation wall-clock time for Playwright tests.
- Keep failure diagnostics clear with per-shard artifacts and a merged final report.
- Avoid large behavioral changes outside PR workflow.

## Non-Goals
- No adaptive shard sizing.
- No changes to main-branch build workflow in this phase.
- No test suite restructuring beyond command routing needed for sharding.

## Selected Approach
Use GitHub matrix sharding in `.github/workflows/test_pull_request.yml`.

### Why this approach
- True parallelization across CI runners.
- Simple fixed model (`1/4`, `2/4`, `3/4`, `4/4`).
- Easy follow-up rollout to `build.yml` after PR stability is verified.

## CI Architecture
Split the current `lintbuildtest` workflow behavior into separate jobs:

1. `lint_build_server`
- Runs existing lint/build/server checks from `deploy-scripts/lint-build-test.sh` logic, but excludes Playwright execution.

2. `playwright_parallel_shards`
- Matrix job with shard indices `[1, 2, 3, 4]`.
- Each matrix leg runs Playwright `parallel_tests` only, with:
  - `--shard=<index>/4`
  - `--workers 1`
- Each leg uploads distinct artifacts.

3. `playwright_serial`
- Runs `non_parallel_tests` and `download_test_webkit` once.
- Uploads serial artifact set.

4. `playwright_report_merge`
- Runs with `if: always()` after all Playwright jobs.
- Downloads all artifacts and merges into one consolidated report artifact.
- Workflow still fails if any upstream job failed.

## Data Flow
1. Checkout + environment setup per job.
2. Start docker services + app under test.
3. Execute tests:
- Matrix jobs: only shard-specific `parallel_tests`.
- Serial job: non-parallel and webkit download tests.
4. Upload artifacts from each job.
5. Merge-report job composes single `playwright-report` output for debugging.

## Failure Handling
- `fail-fast: false` for matrix so all shards run even if one fails.
- Merge step always executes to preserve diagnostics.
- Final PR status fails if any shard or serial suite fails.

## Observability
- Job names include shard index (`Playwright parallel shard X/4`).
- Artifact names include shard index for traceability.
- Merged report artifact remains the default debugging entrypoint.

## Rollout Plan
1. Implement in `test_pull_request.yml` only.
2. Run on several PRs and review stability + duration.
3. Optionally port same structure to `build.yml` after confidence is established.
