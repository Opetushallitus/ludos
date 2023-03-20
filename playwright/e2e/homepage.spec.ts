import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  const el = page.getByTestId('heading')

  expect(await el.innerText()).toBe('Server says: hello ludos')
})
