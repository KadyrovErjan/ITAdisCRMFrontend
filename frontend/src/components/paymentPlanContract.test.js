/* eslint-env node */
import test from 'node:test'
import assert from 'node:assert/strict'
import { PaymentPlanContractError, assertStudentUpdateResponse, validatePaymentPlanResponse } from './paymentPlanContract.js'

const item = {
  id: 'item-1', due_date: '2026-11-05', amount_due: '10000.00',
  amount_paid: '0.00', outstanding: '10000.00', status: 'upcoming',
}

test('accepts an empty schedule without crashing a legacy plan view', () => {
  const plan = { id: 'legacy-plan', items: [], financial_summary: {} }
  assert.equal(validatePaymentPlanResponse(plan), plan)
})

test('rejects a null nested schedule record with a contract error', () => {
  assert.throws(() => validatePaymentPlanResponse({ id: 'plan', items: [null] }), PaymentPlanContractError)
})

test('rejects nested schedule records that omit a required rendering field', () => {
  const malformed = { ...item }
  delete malformed.id
  assert.throws(() => validatePaymentPlanResponse({ id: 'plan', items: [malformed] }), /неполные данные периода/i)
})

test('accepts a complete schedule item returned by the payment-plan endpoint', () => {
  const plan = { id: 'plan', items: [item], financial_summary: { total_paid: '0.00' } }
  assert.equal(validatePaymentPlanResponse(plan), plan)
})

test('requires the canonical Student payload before the group callback can run after saving a plan', () => {
  assert.throws(() => assertStudentUpdateResponse(undefined), PaymentPlanContractError)
  assert.equal(assertStudentUpdateResponse({ id: 'student-1', full_name: 'Test' }).id, 'student-1')
})
