/* eslint-env node */
import { expect, test as base } from '@playwright/test'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const PRODUCTION_HOSTS = new Set(['itadiscrm.com.kg', 'www.itadiscrm.com.kg', 'api.itadiscrm.com.kg'])

export function assertLocalTestUrl(value, label) {
  if (!value) throw new Error(`${label} must be explicitly set to a local test URL.`)
  let url
  try { url = new URL(value) } catch { throw new Error(`${label} is not a valid URL.`) }
  if (url.protocol !== 'http:' || !LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(`${label} must use http://localhost, http://127.0.0.1, or http://[::1]; refusing ${url.origin}.`)
  }
  return url
}

export function localE2EConfig(env = process.env) {
  if (env.ITADIS_TEST_MODE !== '1') throw new Error('ITADIS_TEST_MODE=1 is required for local E2E tests.')
  if (env.E2E_TEST_DATABASE !== '1') throw new Error('E2E_TEST_DATABASE=1 is required for local E2E tests.')
  return {
    baseURL: assertLocalTestUrl(env.E2E_BASE_URL, 'E2E_BASE_URL').toString().replace(/\/$/, ''),
    apiURL: assertLocalTestUrl(env.E2E_API_URL, 'E2E_API_URL').toString().replace(/\/$/, ''),
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // Install before page.goto, so a stale Vite .env cannot send even one
    // request to production. Local assets and local API calls remain allowed.
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if ((url.protocol === 'http:' || url.protocol === 'https:') && !LOCAL_HOSTS.has(url.hostname)) {
        await route.abort('blockedbyclient')
        // Fonts and other optional CDN assets are also kept offline, but they
        // do not make an application-flow test unsafe. A production host is
        // different: surface it as a hard failure after blocking it.
        if (PRODUCTION_HOSTS.has(url.hostname)) throw new Error(`Blocked production E2E request: ${url.origin}`)
        return
      }
      await route.continue()
    })
    await use(page)
  },
})

export { expect }
