import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { KY, kyLabel } from './ky'

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ky-KG', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' сом'
}

export const formatDate = (date) => {
  if (!date) return '-'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, 'dd.MM.yyyy', { locale: ru })
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, 'dd.MM.yyyy HH:mm', { locale: ru })
}

export const formatRole = (role) => {
  const roles = {
    cashier: 'Кассир',
    accountant: 'Бухгалтер',
    director: 'Директор',
    admin: 'Администратор',
  }
  return roles[role] || role
}

export const formatTransactionType = (type) => {
  return kyLabel(KY.transactionType, type, 'Белгисиз операция')
}
