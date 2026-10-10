import test from 'node:test'
import assert from 'node:assert/strict'
import { contractStatusLabel, learningStatusLabel, paymentStatusLabel } from './ky.js'

test('renders API status values in Kyrgyz without changing the values', () => {
  assert.equal(learningStatusLabel('active'), 'Активдүү')
  assert.equal(learningStatusLabel('frozen'), 'Тоңдурулган')
  assert.equal(learningStatusLabel('completed'), 'Аяктаган')
  assert.equal(learningStatusLabel('archived'), 'Архивделген')
  assert.equal(paymentStatusLabel('due'), 'Төлөм күтүлүүдө')
  assert.equal(paymentStatusLabel('paid'), 'Төлөнгөн')
  assert.equal(paymentStatusLabel('overdue'), 'Мөөнөтү өткөн')
  assert.equal(contractStatusLabel('signed'), 'Кол коюлган')
})

test('unknown API status has a safe visible fallback', () => {
  assert.equal(paymentStatusLabel('unrecognized'), '—')
  assert.equal(paymentStatusLabel(null), '—')
  assert.equal(learningStatusLabel(undefined), '—')
  assert.equal(contractStatusLabel(null), '—')
})
