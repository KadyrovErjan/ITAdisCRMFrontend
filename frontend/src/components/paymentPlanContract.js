export class PaymentPlanContractError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaymentPlanContractError'
  }
}

const requiredItemFields = ['id', 'due_date', 'amount_due', 'amount_paid', 'outstanding', 'status']

/**
 * The payment-plan endpoint is deliberately checked at the boundary. A plan
 * item is not optional once it appears in `items`: rendering a partial item
 * would give the cashier an unreliable financial schedule.
 */
export function validatePaymentPlanResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new PaymentPlanContractError('CRM вернула некорректный ответ для графика оплаты.')
  }
  if (!Array.isArray(payload.items)) {
    throw new PaymentPlanContractError('CRM вернула график оплаты без списка периодов.')
  }

  payload.items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new PaymentPlanContractError(`CRM вернула повреждённый период №${index + 1} в графике оплаты.`)
    }
    const missing = requiredItemFields.filter((field) => item[field] === null || item[field] === undefined || item[field] === '')
    if (missing.length) {
      throw new PaymentPlanContractError(`CRM вернула неполные данные периода №${index + 1}: ${missing.join(', ')}.`)
    }
  })

  return payload
}

export function assertStudentUpdateResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !payload.id) {
    throw new PaymentPlanContractError('CRM сохранила график, но вернула неполные данные ученика для обновления страницы.')
  }
  return payload
}
