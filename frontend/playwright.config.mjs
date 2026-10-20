/* eslint-env node */
import { defineConfig } from '@playwright/test'
import { localE2EConfig } from './e2e/localOnly.mjs'

const { baseURL } = localE2EConfig(process.env)

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL,
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
  },
})
