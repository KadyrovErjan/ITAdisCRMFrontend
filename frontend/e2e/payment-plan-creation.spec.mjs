import { expect, test } from '@playwright/test'

const username = process.env.E2E_CASHIER_LOGIN
const password = process.env.E2E_CASHIER_PASSWORD
const groupName = process.env.E2E_GROUP_NAME
const studentName = process.env.E2E_STUDENT_NAME
const studentId = process.env.E2E_STUDENT_ID
const refreshFailureStudentName = process.env.E2E_REFRESH_FAILURE_STUDENT_NAME
const refreshFailureStudentId = process.env.E2E_REFRESH_FAILURE_STUDENT_ID

test.skip(!username || !password || !groupName || !studentName || !studentId,
  'Set local E2E_CASHIER_LOGIN, E2E_CASHIER_PASSWORD, E2E_GROUP_NAME, E2E_STUDENT_NAME and E2E_STUDENT_ID.')

test('creating a payment plan refreshes StudentDetails and Groups without a page crash', async ({ page }) => {
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })

  await page.goto('/login')
  await page.getByLabel('Логин', { exact: true }).fill(username)
  await page.getByLabel('Сырсөз', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Кирүү', exact: true }).click()
  await page.waitForURL('**/dashboard')

  await page.goto('/groups')
  await page.getByRole('heading', { name: groupName, exact: true }).click()
  const studentRow = page.getByRole('row').filter({ hasText: studentName })
  await studentRow.getByRole('button', { name: 'Карточка', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Настроить график', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Настроить график', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Настроить график оплаты', exact: true })).toBeVisible()
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/students/${studentId}/payment-plan/`) && response.request().method() === 'POST' && response.status() === 201),
    page.getByRole('button', { name: 'Сохранить график', exact: true }).click(),
  ])

  await expect(page.getByRole('heading', { name: 'График оплаты', exact: true })).toBeVisible()
  await expect(studentRow).not.toContainText('График түзүлгөн эмес')
  await expect(page.getByText('График оплаты сохранён', { exact: true })).toBeVisible()
  expect(runtimeErrors.filter((message) => /Cannot read properties of undefined|updated\.id/.test(message))).toEqual([])
})

test.skip(!refreshFailureStudentName || !refreshFailureStudentId,
  'Set E2E_REFRESH_FAILURE_STUDENT_NAME and E2E_REFRESH_FAILURE_STUDENT_ID to cover the refresh failure path.')

test('a saved plan stays visible when the canonical Student refresh fails', async ({ page }) => {
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  await page.goto('/login')
  await page.getByLabel('Логин', { exact: true }).fill(username)
  await page.getByLabel('Сырсөз', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Кирүү', exact: true }).click()
  await page.waitForURL('**/dashboard')

  await page.goto('/groups')
  await page.getByRole('heading', { name: groupName, exact: true }).click()
  const studentRow = page.getByRole('row').filter({ hasText: refreshFailureStudentName })
  await studentRow.getByRole('button', { name: 'Карточка', exact: true }).click()
  await page.getByRole('button', { name: 'Настроить график', exact: true }).click()

  await page.route(`**/students/${refreshFailureStudentId}/`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Synthetic refresh failure' }) })
      return
    }
    await route.continue()
  })
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/students/${refreshFailureStudentId}/payment-plan/`) && response.request().method() === 'POST' && response.status() === 201),
    page.getByRole('button', { name: 'Сохранить график', exact: true }).click(),
  ])

  await expect(page.getByText('График сохранён, но не удалось обновить данные. Обновите страницу.', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'График оплаты', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Настроить график', exact: true })).toHaveCount(0)
  expect(runtimeErrors.filter((message) => /Cannot read properties of undefined|updated\.id/.test(message))).toEqual([])
})
