import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ClockIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { studentsAPI } from '../services/api'
import { formatCurrency, formatDateTime, formatTransactionType } from '../utils/format'
import StudentPaymentPlan from './StudentPaymentPlan'

function initialForm(student) {
  return {
    full_name: student.full_name || '',
    phone: student.phone || '',
    course_price: student.course_price ?? '',
    assistant_name: student.assistant_name || '',
    contract_status: student.contract_status || 'unknown',
    comment: student.comment || '',
  }
}

export default function StudentDetails({ student, onChanged, onClose = () => {}, children }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(() => initialForm(student))
  const [success, setSuccess] = useState('')
  const { data: historyResponse, isLoading } = useQuery({
    queryKey: ['student-details-history', student.id],
    queryFn: () => studentsAPI.getHistory(student.id),
  })
  const history = historyResponse?.results || historyResponse || []
  const finance = student.financial_summary || {}
  const updateMutation = useMutation({
    mutationFn: (data) => studentsAPI.updateDetails(student.id, data),
    onSuccess: (updated) => {
      setSuccess('Маалыматтар сакталды.')
      setIsEditing(false)
      setForm(initialForm(updated))
      onChanged?.(updated)
    },
  })

  const updateField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }))
  const cancelEditing = () => {
    updateMutation.reset()
    setSuccess('')
    setForm(initialForm(student))
    setIsEditing(false)
  }
  const submitEditing = (event) => {
    event.preventDefault()
    setSuccess('')
    const values = event.currentTarget.elements
    updateMutation.mutate({
      full_name: values.full_name.value,
      phone: values.phone.value || null,
      assistant_name: values.assistant_name.value || null,
      contract_status: values.contract_status.value,
      comment: values.comment.value || null,
      course_price: values.course_price.value || null,
    })
  }

  return <section className="card relative p-6">
    <button type="button" onClick={onClose} aria-label="Карточканы жабуу" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><XMarkIcon className="h-6 w-6" /></button>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 pr-10">
      <div><h2 className="text-xl font-extrabold text-slate-900">{student.full_name}</h2><p className="mt-1 text-sm text-slate-500">{student.phone || 'Телефон көрсөтүлгөн эмес'} · {student.group_name}</p><p className="mt-1 text-sm text-slate-500">Ассистент: {student.assistant_name || '—'} · Келишим: {student.contract_status || 'unknown'}</p>{student.comment && <p className="mt-1 text-sm text-slate-500">{student.comment}</p>}</div>
      <div className="flex items-center gap-2">{children}<button type="button" onClick={() => { setSuccess(''); setForm(initialForm(student)); setIsEditing(true) }} className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"><PencilSquareIcon className="h-4 w-4" />Редактировать</button></div>
    </div>
    {success && <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}
    {isEditing && <form onSubmit={submitEditing} className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <h3 className="font-bold text-slate-900">Редактировать ученика</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="ФИО" name="full_name" required value={form.full_name} onChange={(value) => updateField('full_name', value)} />
        <Field label="Телефон" name="phone" value={form.phone} onChange={(value) => updateField('phone', value)} />
        <Field label="Стоимость курса" name="course_price" type="number" min="0" step="0.01" value={form.course_price} onChange={(value) => updateField('course_price', value)} />
        <Field label="Ассистент" name="assistant_name" value={form.assistant_name} onChange={(value) => updateField('assistant_name', value)} />
        <label className="block text-sm font-medium text-slate-700">Статус договора<select name="contract_status" value={form.contract_status} onChange={(event) => updateField('contract_status', event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="unknown">Не указан</option><option value="signed">Подписан</option><option value="not_signed">Не подписан</option></select></label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Комментарий<textarea name="comment" value={form.comment} onChange={(event) => updateField('comment', event.target.value)} rows="3" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" /></label>
      </div>
      <p className="mt-3 text-xs text-slate-500">При подтверждённом графике стоимость курса нельзя изменить здесь: финансовая история и график останутся неизменными.</p>
      {updateMutation.isError && <p role="alert" className="mt-3 text-sm text-red-700">{updateMutation.error?.response?.data?.course_price?.[0] || updateMutation.error?.response?.data?.detail || 'Не удалось сохранить изменения.'}</p>}
      <div className="mt-4 flex justify-end gap-3"><button type="button" onClick={cancelEditing} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Отмена</button><button type="submit" disabled={updateMutation.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{updateMutation.isPending ? 'Сохранение…' : 'Сохранить'}</button></div>
    </form>}
    <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6"><Metric label="Курстун баасы" value={student.course_price === null || student.course_price === undefined || student.course_price === '' ? '—' : formatCurrency(student.course_price)} /><Metric label="Төлөнгөн" value={formatCurrency(finance.total_paid || student.amount_paid_total || 0)} /><Metric label="Бүгүн" value={formatCurrency(finance.due_now || 0)} /><Metric label="Мөөнөтү өткөн" value={formatCurrency(finance.overdue_amount || 0)} /><Metric label="Калдык" value={finance.contract_remaining === null ? '—' : formatCurrency(finance.contract_remaining || 0)} /><Metric label="Ашыкча төлөм" value={formatCurrency(finance.credit_amount || 0)} /></div>
    <p className="mt-3 text-sm text-slate-600">Окуу: {student.learning_status} · {student.group_technology || 'Багыт көрсөтүлгөн эмес'} · кийинки төлөм: {finance.next_payment_date || '—'} {finance.next_payment_amount && formatCurrency(finance.next_payment_amount)}</p>
    <StudentPaymentPlan student={student} onChanged={onChanged} />
    <div className="mt-6"><h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><ClockIcon className="h-5 w-5" /> Төлөм тарыхы</h3>{isLoading ? <p className="text-sm text-slate-500">Жүктөлүүдө…</p> : history.length ? <div className="space-y-2">{history.map((item) => <div key={item.id} className="flex justify-between rounded-xl border border-slate-100 p-3"><span>{formatTransactionType(item.type)} · {formatDateTime(item.created_at)}</span><b className="text-emerald-700">+{formatCurrency(item.amount)}</b></div>)}</div> : <p className="text-sm text-slate-500">Төлөмдөр азырынча жок.</p>}</div>
  </section>
}

function Field({ label, value, onChange, type = 'text', required = false, ...props }) {
  const syncValue = (event) => onChange(event.target.value)
  return <label className="block text-sm font-medium text-slate-700">{label}<input type={type} required={required} value={value} onChange={syncValue} onInput={syncValue} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" {...props} /></label>
}

function Metric({ label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div> }
