import { synthetics } from '@aws/synthetics-playwright'

const stepConfig = { screenshotOnStepFailure: true, continueOnStepFailure: false, stepsReport: true }

export const handler = async () => {
  try {
    const domain = requiredEnv('DOMAIN')
    const loginPageUrl = `https://${domain}/kirjaudu`
    const healthCheckUrl = `https://${domain}/api/health-check`
    const browser = await synthetics.launch()
    const page = await synthetics.newPage(browser)
    const step = (name: string, check: () => Promise<void>) => synthetics.executeStep(name, check, stepConfig, page)

    await step('health-check-returns-ok', async () => {
      const response = await page.goto(healthCheckUrl, { waitUntil: 'domcontentloaded' })
      if (response?.status() !== 200) {
        throw new Error(`Expected health check status 200, got ${response?.status()}`)
      }
      if ((await response.text()).trim() !== 'ok') {
        throw new Error('Expected health check response body to be "ok"')
      }
    })

    await step('web-page-returns-http-200', async () => {
      const response = await page.goto(loginPageUrl, { waitUntil: 'domcontentloaded' })
      if (response?.status() !== 200) {
        throw new Error(`Expected web page status 200, got ${response?.status()}`)
      }
    })

    await step('welcome-heading-is-visible', async () => {
      await page
        .getByRole('heading', { name: 'Tervetuloa Ludos-palveluun', exact: true })
        .waitFor({ state: 'visible', timeout: 15000 })
    })

    const loginButton = page.getByTestId('login-button')
    await step('login-button-is-visible', async () => {
      await loginButton.waitFor({ state: 'visible', timeout: 15000 })
    })

    await step('login-button-points-to-auth-login', async () => {
      const loginHref = await loginButton.getAttribute('href')
      if (!loginHref?.startsWith('/api/auth/login')) {
        throw new Error(`Expected login button href to start with /api/auth/login, got ${loginHref}`)
      }
    })
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
