import assert from 'node:assert/strict'
import test from 'node:test'
import { assertLocalTestUrl, localE2EConfig } from './localOnly.mjs'

test('local E2E guard rejects production and missing URLs before a request', () => {
  assert.throws(() => assertLocalTestUrl('https://api.itadiscrm.com.kg/api/v1', 'E2E_API_URL'), /refusing/)
  assert.throws(() => localE2EConfig({ ITADIS_TEST_MODE: '1', E2E_TEST_DATABASE: '1' }), /E2E_BASE_URL/)
})

test('local E2E guard accepts explicit loopback endpoints', () => {
  const config = localE2EConfig({
    ITADIS_TEST_MODE: '1', E2E_TEST_DATABASE: '1',
    E2E_BASE_URL: 'http://127.0.0.1:3001', E2E_API_URL: 'http://localhost:8008/api/v1',
  })
  assert.equal(config.baseURL, 'http://127.0.0.1:3001')
  assert.equal(config.apiURL, 'http://localhost:8008/api/v1')
})
