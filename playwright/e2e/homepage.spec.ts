import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  const el = page.getByTestId('heading')

  await expect(el).toHaveText(
    'Hei Yrjö Ylivoima, tervetuloa Koepankin ylläpitoon!Terkkuja koepankin taustajärjestelmästä.'
  )
})
