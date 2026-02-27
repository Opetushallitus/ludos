# Playwright CI Sharding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add fixed 4-way Playwright sharding to PR validation CI using GitHub matrix jobs while keeping non-parallel suites and merged reporting.

**Architecture:** Keep existing Docker-based Playwright execution model. Add shard-aware wrapper scripts in `deploy-scripts/` and refactor `test_pull_request.yml` into dedicated jobs for lint/build/server checks, parallel shard runs, serial suites, and report consolidation.

**Tech Stack:** GitHub Actions, Bash, Docker Compose, Playwright 1.58.x

---

### Task 1: Create script entrypoint for non-Playwright checks

**Files:**
- Create: `deploy-scripts/lint-build-server-test.sh`
- Reference: `deploy-scripts/lint-build-test.sh`

**Step 1: Write the failing validation check**

Run:
```bash
bash -lc 'test -x deploy-scripts/lint-build-server-test.sh'
```
Expected: FAIL because file does not exist.

**Step 2: Add minimal implementation**

Create `deploy-scripts/lint-build-server-test.sh` by copying the current structure from `lint-build-test.sh` but with:
- `main()` calling only `lint`, `build`, and `test-server`
- no `playwright-test` call

Set executable bit.

**Step 3: Run syntax verification**

Run:
```bash
bash -n deploy-scripts/lint-build-server-test.sh
```
Expected: PASS (exit code 0, no output).

**Step 4: Commit**

```bash
git add deploy-scripts/lint-build-server-test.sh
git commit -m "ci: add lint-build-server script for pr workflow split"
```

### Task 2: Add shard-capable Playwright wrapper scripts

**Files:**
- Create: `deploy-scripts/run-playwright-parallel-shard.sh`
- Create: `deploy-scripts/run-playwright-serial.sh`
- Modify: `deploy-scripts/03-run-playwright-tests.sh`

**Step 1: Write the failing validation check**

Run:
```bash
bash -lc 'test -x deploy-scripts/run-playwright-parallel-shard.sh && test -x deploy-scripts/run-playwright-serial.sh'
```
Expected: FAIL because wrapper scripts do not exist.

**Step 2: Write minimal reusable implementation in `03-run-playwright-tests.sh`**

Refactor to expose functions:
- `playwright_prepare_env` (start db + app container + build playwright image)
- `playwright_cleanup`
- `playwright_run_parallel_shard <shard_index> <shard_total>` (runs `--project parallel_tests --workers 1 --shard X/Y`)
- `playwright_run_serial_suites` (runs `non_parallel_tests` and `download_test_webkit`)

Preserve existing network, env vars, and volume mount behavior.

**Step 3: Create wrapper scripts**

- `run-playwright-parallel-shard.sh`:
  - accepts `SHARD_INDEX` and optional `SHARD_TOTAL` (default `4`)
  - sources `03-run-playwright-tests.sh`
  - calls prepare, shard run, cleanup via `trap`
- `run-playwright-serial.sh`:
  - sources `03-run-playwright-tests.sh`
  - calls prepare, serial run, cleanup via `trap`

**Step 4: Run syntax verification**

Run:
```bash
bash -n deploy-scripts/03-run-playwright-tests.sh
bash -n deploy-scripts/run-playwright-parallel-shard.sh
bash -n deploy-scripts/run-playwright-serial.sh
```
Expected: all PASS.

**Step 5: Commit**

```bash
git add deploy-scripts/03-run-playwright-tests.sh deploy-scripts/run-playwright-parallel-shard.sh deploy-scripts/run-playwright-serial.sh
git commit -m "ci: add shard and serial playwright script entrypoints"
```

### Task 3: Refactor PR workflow into matrix + serial + merge jobs

**Files:**
- Modify: `.github/workflows/test_pull_request.yml`

**Step 1: Write the failing validation check**

Run:
```bash
rg -n "matrix:|shard|playwright_parallel_shards|playwright_serial|playwright_report_merge" .github/workflows/test_pull_request.yml
```
Expected: FAIL to find new job names and matrix shard config.

**Step 2: Implement workflow split**

Update workflow to jobs:
- `lint_build_server`
  - runs `./deploy-scripts/lint-build-server-test.sh`
- `playwright_parallel_shards`
  - `needs: lint_build_server`
  - strategy:
    - `fail-fast: false`
    - `max-parallel: 4`
    - `matrix.shard: [1, 2, 3, 4]`
  - runs `./deploy-scripts/run-playwright-parallel-shard.sh ${{ matrix.shard }} 4`
  - uploads shard-specific artifact name including `${{ matrix.shard }}`
- `playwright_serial`
  - `needs: lint_build_server`
  - runs `./deploy-scripts/run-playwright-serial.sh`
  - uploads serial artifact
- `playwright_report_merge`
  - `if: always()`
  - `needs: [playwright_parallel_shards, playwright_serial]`
  - downloads all previous artifacts
  - merges reports and uploads consolidated `playwright-report`
  - exits non-zero if any required upstream job failed

**Step 3: Add merge command implementation**

In merge job, use Playwright merge utility from `playwright/` directory, for example:
```bash
cd playwright
npx playwright merge-reports --reporter html ./playwright-results-merged
```
Adjust exact paths to downloaded artifact layout so output ends at `playwright/playwright-results/playwright-report/`.

**Step 4: Validate YAML and key sections**

Run:
```bash
rg -n "playwright_parallel_shards|matrix:|fail-fast: false|max-parallel: 4|playwright_report_merge" .github/workflows/test_pull_request.yml
```
Expected: matches all key lines.

**Step 5: Commit**

```bash
git add .github/workflows/test_pull_request.yml
git commit -m "ci: shard playwright tests in pr workflow"
```

### Task 4: Verify end-to-end behavior locally where possible

**Files:**
- Modify (if needed): `.github/workflows/test_pull_request.yml`
- Modify (if needed): `deploy-scripts/*.sh`

**Step 1: Run local static verification**

Run:
```bash
bash -n deploy-scripts/lint-build-server-test.sh
bash -n deploy-scripts/03-run-playwright-tests.sh
bash -n deploy-scripts/run-playwright-parallel-shard.sh
bash -n deploy-scripts/run-playwright-serial.sh
```
Expected: PASS.

**Step 2: Smoke-test one shard command (optional, if Docker/services available)**

Run:
```bash
./deploy-scripts/run-playwright-parallel-shard.sh 1 4
```
Expected: shard 1/4 executes `parallel_tests` with `--workers 1` and exits 0.

**Step 3: Final commit for verification fixes**

```bash
git add .
git commit -m "ci: finalize playwright shard workflow validation"
```

### Task 5: Document operation and rollout guardrails

**Files:**
- Create: `docs/plans/2026-02-27-playwright-ci-sharding-rollout-notes.md`

**Step 1: Write rollout notes**

Document:
- How to interpret shard failures
- Artifact naming conventions
- How to re-run a single failing shard manually
- Criteria for porting same model to `build.yml`

**Step 2: Verify docs file exists**

Run:
```bash
test -f docs/plans/2026-02-27-playwright-ci-sharding-rollout-notes.md
```
Expected: PASS.

**Step 3: Commit**

```bash
git add docs/plans/2026-02-27-playwright-ci-sharding-rollout-notes.md
git commit -m "docs: add playwright sharding rollout notes"
```

## Final Verification Checklist

Run:
```bash
bash -n deploy-scripts/lint-build-server-test.sh
bash -n deploy-scripts/03-run-playwright-tests.sh
bash -n deploy-scripts/run-playwright-parallel-shard.sh
bash -n deploy-scripts/run-playwright-serial.sh
rg -n "playwright_parallel_shards|playwright_serial|playwright_report_merge|max-parallel: 4|fail-fast: false" .github/workflows/test_pull_request.yml
```

Expected:
- all shell syntax checks pass
- workflow contains all required jobs and shard settings

