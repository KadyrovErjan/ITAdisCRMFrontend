import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { studentsAPI } from '../services/api'
import { formatCurrency } from '../utils/format'
import { assertStudentUpdateResponse, validatePaymentPlanResponse } from './paymentPlanContract'

const numeric = (value) => Number.parseFloat(value || 0)
const localIso = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
const isoToday = () => localIso(new Date())
const addMonths = (value, offset) => {
  const source = new Date(`${value}T00:00:00`)
  const day = source.getDate()
  const target = new Date(source.getFullYear(), source.getMonth() + offset + 1, 0)
  return localIso(new Date(target.getFullYear(), target.getMonth(), Math.min(day, target.getDate())))
}

function moneySplit(total, count) {
  const cents = Math.round(numeric(total) * 100)
  if (!cents || !count) return []
  const base = Math.floor(cents / count)
  return Array.from({ length: count }, (_, index) => ((index === count - 1 ? cents - base * (count - 1) : base) / 100).toFixed(2))
}

const labels = { paid: 'Оплачено', overdue: 'Просрочено', due: 'К оплате сегодня', upcoming: 'Предстоит' }

export default function StudentPaymentPlan({ student, onChanged }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ payment_method: 'monthly', period_count: 6, start_date: isoToday(), items: [] })
  const query = useQuery({
    queryKey: ['student-payment-plan', student.id],
    queryFn: async () => validatePaymentPlanResponse(await studentsAPI.getPaymentPlan(student.id)),
    retry: false,
  })
  const plan = query.data
  const summary = plan?.financial_summary || student.financial_summary || {}
  const isCustom = form.payment_method === 'custom'
  const preview = useMemo(() => {
    const price = student.course_price
    if (!price) return []
    if (form.payment_method === 'full') return [{ due_date: form.start_date, amount_due: Number(price).toFixed(2) }]
    if (isCustom) return form.items
    return moneySplit(price, Number(form.period_count || 0)).map((amount_due, index) => ({ due_date: addMonths(form.start_date, index), amount_due }))
  }, [form, isCustom, student.course_price])
  const scheduled = preview.reduce((total, item) => total + numeric(item.amount_due), 0)
  const valid = Boolean(student.course_price && preview.length && Math.abs(scheduled - numeric(student.course_price)) < 0.005)
  const save = useMutation({
    mutationFn: () => studentsAPI.createPaymentPlan(student.id, { ...form, period_count: preview.length, items: isCustom ? preview : undefined }),
    onSuccess: async () => {
      toast.success('График оплаты сохранён')
      setEditing(false)
      await queryClient.invalidateQueries({ queryKey: ['student-payment-plan', student.id] })
      try {
        // POST /payment-plan/ intentionally returns plan metadata, not a Student.
        // Fetch the canonical Student before notifying the group list callback.
        onChanged?.(assertStudentUpdateResponse(await studentsAPI.get(student.id)))
      } catch (error) {
        console.error('Payment plan was saved but the student refresh failed:', error)
        toast.error(error.message || 'График сохранён, но карточку ученика не удалось обновить. Обновите страницу.')
      }
    },
    onError: (error) => toast.error(error.response?.data?.items || error.response?.data?.detail || 'Не удалось сохранить график'),
  })
  const start = () => {
    if (!student.course_price) return toast.error('Сначала укажите стоимость курса в договоре')
    setForm({ payment_method: 'monthly', period_count: 6, start_date: isoToday(), items: [] }); setEditing(true)
  }
  const setMethod = (payment_method) => {
    const next = { ...form, payment_method }
    if (payment_method === 'custom' && !next.items.length) next.items = moneySplit(student.course_price, Number(form.period_count || 1)).map((amount_due, index) => ({ due_date: addMonths(form.start_date, index), amount_due }))
    setForm(next)
  }
  if (query.isLoading) return <p className="mt-5 text-sm text-slate-500">Загрузка графика…</p>
  if (query.isError && query.error?.response?.status !== 404) return <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert"><b>Не удалось безопасно отобразить график оплаты.</b><p className="mt-1">{query.error?.message || 'Получен некорректный ответ CRM. Финансовые данные не изменены.'}</p></section>
  if (!plan && !editing) return <section className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5"><h3 className="font-bold text-slate-900">График оплаты</h3><p className="mt-2 text-sm text-slate-500">График оплаты не настроен. Старые платежи сохранены и не считаются просрочкой.</p><button className="btn btn-secondary mt-4" onClick={start}>Настроить график</button></section>
  if (editing) return <section className="mt-6 rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-900">Настроить график оплаты</h3><div className="mt-4 grid gap-3 sm:grid-cols-3"><label><span className="label">Стоимость курса</span><input className="input" value={student.course_price || ''} disabled /></label><label><span className="label">Способ оплаты</span><select className="input" value={form.payment_method} onChange={(e) => setMethod(e.target.value)}><option value="full">Полностью</option><option value="monthly">Ежемесячно</option><option value="custom">Индивидуально</option></select></label><label><span className="label">Первый платёж</span><input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label>{form.payment_method !== 'full' && <label><span className="label">Количество платежей</span><input className="input" type="number" min="1" value={form.period_count} onChange={(e) => setForm({ ...form, period_count: e.target.value })} /></label>}</div><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>№</th><th>Дата</th><th>Сумма</th>{isCustom && <th />}</tr></thead><tbody>{preview.map((item, index) => <tr key={`${item.due_date}-${index}`}><td>{index + 1}</td><td>{isCustom ? <input className="input" type="date" value={item.due_date} onChange={(e) => setForm({ ...form, items: form.items.map((row, i) => i === index ? { ...row, due_date: e.target.value } : row) })} /> : item.due_date}</td><td>{isCustom ? <input className="input" type="number" min="0.01" step="0.01" value={item.amount_due} onChange={(e) => setForm({ ...form, items: form.items.map((row, i) => i === index ? { ...row, amount_due: e.target.value } : row) })} /> : formatCurrency(item.amount_due)}</td>{isCustom && <td><button type="button" className="text-sm text-red-600" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>Удалить</button></td>}</tr>)}</tbody></table></div>{isCustom && <button type="button" className="btn btn-secondary mt-3" onClick={() => setForm({ ...form, items: [...form.items, { due_date: form.start_date, amount_due: '0.00' }] })}>Добавить строку</button>}<p className="mt-4 font-semibold">Итого графика: {formatCurrency(scheduled)} / {formatCurrency(student.course_price || 0)}</p>{!valid && <p className="mt-1 text-sm text-red-600">Не распределено: {formatCurrency(Math.abs(numeric(student.course_price) - scheduled))}</p>}<div className="mt-5 flex justify-end gap-2"><button className="btn btn-secondary" onClick={() => setEditing(false)}>Отмена</button><button className="btn btn-primary" disabled={!valid || save.isPending} onClick={() => save.mutate()}>Сохранить график</button></div></section>
  return <section className="mt-6"><h3 className="font-bold text-slate-900">График оплаты</h3><div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><small>К оплате сегодня</small><b className="block">{formatCurrency(summary.due_now || 0)}</b></div><div className="rounded-xl bg-red-50 p-3"><small>Просрочено</small><b className="block text-red-700">{formatCurrency(summary.overdue_amount || 0)}</b></div><div className="rounded-xl bg-sky-50 p-3"><small>Следующий платёж</small><b className="block">{summary.next_payment_date || '—'} {summary.next_payment_amount && formatCurrency(summary.next_payment_amount)}</b></div></div>{plan.items.length ? <div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Дата</th><th>Сумма</th><th>Оплачено</th><th>Осталось</th><th>Статус</th></tr></thead><tbody>{plan.items.map((item) => <tr key={item.id}><td>{item.due_date}</td><td>{formatCurrency(item.amount_due)}</td><td>{formatCurrency(item.amount_paid)}</td><td>{formatCurrency(item.outstanding)}</td><td>{labels[item.status] || item.status}</td></tr>)}</tbody></table></div> : <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">В подтверждённом графике пока нет периодов. Финансовые операции не изменены.</p>}</section>
}
