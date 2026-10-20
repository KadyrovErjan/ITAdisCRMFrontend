/* eslint-env node */
import { expect, test } from './localOnly.mjs'

const password = process.env.E2E_HANDOVER_PASSWORD
test.skip(!password, 'Set E2E_HANDOVER_PASSWORD for the isolated synthetic accounts.')

for (const role of ['director', 'cashier', 'accountant']) {
  test(`${role} can open the empty workspace`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/login')
    await page.getByLabel('Логин', { exact: true }).fill(`local-${role}`)
    await page.getByLabel('Сырсөз', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Кирүү', exact: true }).click()
    await page.waitForURL('**/dashboard')
    await page.goto('/groups')
    await expect(page.getByRole('button', { name: 'Excel жүктөө' })).toHaveCount(role === 'cashier' ? 1 : 0)
    if (role === 'cashier') {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Excel жүктөө' }).click(),
      ])
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/)
      expect(await download.failure()).toBeNull()
    }
    if (role === 'accountant') {
      await page.goto('/expenses')
      await expect(page.locator('body')).not.toContainText('TypeError')
    }
    expect(errors).toEqual([])
  })
}
