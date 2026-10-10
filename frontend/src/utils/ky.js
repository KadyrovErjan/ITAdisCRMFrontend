// Display-only Kyrgyz labels. API values intentionally stay unchanged.
export const KY = {
  learningStatus: {
    active: 'Активдүү',
    frozen: 'Тоңдурулган',
    completed: 'Аяктаган',
    archived: 'Архивделген',
    expelled: 'Четтетилген',
    debt: 'Төлөм күтүлүүдө',
  },
  paymentStatus: {
    paid: 'Төлөнгөн',
    upcoming: 'Кийинки төлөм',
    due: 'Төлөм күтүлүүдө',
    overdue: 'Мөөнөтү өткөн',
    overpaid: 'Ашыкча төлөм',
    unknown: 'График түзүлгөн эмес',
  },
  contractStatus: {
    signed: 'Кол коюлган',
    not_signed: 'Кол коюла элек',
    unknown: 'Көрсөтүлгөн эмес',
  },
  paymentMethod: {
    full: 'Толук төлөм',
    monthly: 'Ай сайын',
    custom: 'Жеке график',
  },
  transactionType: {
    booking: 'Бронь',
    register: 'Каттоо',
    topup: 'Кошумча төлөм',
  },
}

export const kyLabel = (dictionary, value, fallback = '—') => dictionary?.[value] || fallback
export const learningStatusLabel = (value) => kyLabel(KY.learningStatus, value)
export const paymentStatusLabel = (value) => kyLabel(KY.paymentStatus, value)
export const contractStatusLabel = (value) => kyLabel(KY.contractStatus, value)
