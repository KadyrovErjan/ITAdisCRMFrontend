/* eslint-env node */
import { expect, test } from '@playwright/test'

const username = process.env.E2E_CASHIER_LOGIN
const password = process.env.E2E_CASHIER_PASSWORD
const groupName = process.env.E2E_SCROLL_GROUP_NAME
const studentName = process.env.E2E_SCROLL_STUDENT_NAME

test.skip(!username || !password || !groupName || !studentName,
  'Set local E2E_CASHIER_LOGIN, E2E_CASHIER_PASSWORD, E2E_SCROLL_GROUP_NAME and E2E_SCROLL_STUDENT_NAME.')

async function openStudent(page) {
  await page.goto('/login')
  await page.getByLabel('Логин', { exact: true }).fill(username)
  await page.getByLabel('Сырсөз', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Кирүү', exact: true }).click()
  await page.waitForURL('**/dashboard')
  await page.goto('/groups')
  await page.getByRole('heading', { name: groupName, exact: true }).click()
  const row = page.getByRole('row').filter({ hasText: studentName })
  await row.getByRole('button', { name: 'Маалымат', exact: true }).click()
  return row
}

for (const device of [
  { name: 'desktop', viewport: { width: 1366, height: 768 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
]) {
  test.describe(device.name, () => {
    test.use({ viewport: device.viewport })

    test('opens details into view, preserves edit position, and restores the source row', async ({ page }) => {
      const row = await openStudent(page)
      await expect(row).toContainText('Активдүү')
      const details = page.getByLabel('Окуучунун карточкасы')
      await expect(details).toBeVisible()
      await expect(details).toContainText('Кол коюлган')
      await expect.poll(async () => (await details.boundingBox())?.y ?? Infinity).toBeLessThan(device.viewport.height)

      await page.getByRole('button', { name: 'Өзгөртүү', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Окуучунун маалыматтарын өзгөртүү', exact: true })).toBeVisible()
      const editBox = await page.getByRole('heading', { name: 'Окуучунун маалыматтарын өзгөртүү', exact: true }).boundingBox()
      expect(editBox?.y).toBeLessThan(device.viewport.height)
      await page.getByRole('button', { name: 'Жокко чыгаруу', exact: true }).click()
      // Removing the inline form changes page height, but must not send the
      // user back to the top of the group list.
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100)

      await page.getByRole('button', { name: 'Өзгөртүү', exact: true }).click()
      const comment = `Локалдык QA ${device.name}`
      await page.getByLabel('Түшүндүрмө', { exact: true }).fill(comment)
      await page.getByRole('button', { name: 'Сактоо', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('Маалыматтар сакталды.')
      await expect(details).toContainText(comment)

      await page.getByRole('button', { name: 'Карточканы жабуу', exact: true }).click()
      await expect(details).toHaveCount(0)
      await expect.poll(async () => (await row.boundingBox())?.y ?? -Infinity).toBeGreaterThan(0)
      await expect.poll(async () => (await row.boundingBox())?.y ?? Infinity).toBeLessThan(device.viewport.height)
    })
  })
}
