import { synthetics } from '@aws/synthetics-playwright'

export const handler = async () => {
  try {
    const browser = await synthetics.launch()
    const page = await synthetics.newPage(browser)
    const response = await page.goto(requiredEnv('LANDING_PAGE_URL'), { waitUntil: 'domcontentloaded' })
    if (response?.status() !== 200) {
      throw new Error(`Expected status 200, got ${response?.status()}`)
    }
    const loginButton = page.getByTestId('login-button')
    await loginButton.waitFor({ state: 'visible', timeout: 15000 })
    const loginHref = await loginButton.getAttribute('href')
    if (!loginHref?.startsWith('/api/auth/login')) {
      throw new Error(`Unexpected login button href: ${loginHref}`)
    }
  } finally {
    await synthetics.close()
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}`)
  }
  return value
}
