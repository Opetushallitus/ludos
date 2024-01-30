import { defineConfig, devices } from '@playwright/test'
import * as process from 'process'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 8000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI ? 'http://localhost:8080' : 'http://localhost:8000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    testIdAttribute: 'data-testid',
    screenshot: 'only-on-failure'
  },

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results',

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },
    {
      name: 'parallel_tests',
      testDir: 'parallel_tests',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    },
    {
      name: 'non_parallel_tests',
      testDir: 'non_parallel_tests',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    }
  ]
})
