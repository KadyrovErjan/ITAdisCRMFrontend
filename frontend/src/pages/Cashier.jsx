import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowsRightLeftIcon, BanknotesIcon, ClockIcon,
  MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { cashierAPI, groupsAPI, studentsAPI } from '../services/api'
import { formatCurrency, formatDateTime, formatTransactionType } from '../utils/format'

const freshKey = () => globalThis.crypto?.randomUUID?.() || `cashier-${Date.now()}-${Math.random()}`
const amount = (value) => Number.parseFloat(value || 0)
const studentList = (response) => response?.results || response || []

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4" onMouseDown={onClose}>
      <div className="mx-auto mt-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={onClose} aria-label="Закрыть"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PaymentStatus({ value }) {
  const labels = { debt: ['Долг', 'bg-amber-100 text-amber-800'], paid: ['Оплачено', 'bg-emerald-100 text-emerald-800'], overpaid: ['Переплата', 'bg-sky-100 text-sky-800'], unknown: ['Цена не указана', 'bg-slate-100 text-slate-700'] }
  const [label, styles] = labels[value] || labels.unknown
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>{label}</span>
}

export default function Cashier() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [paymentStatus, setPaymentStatus] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [modal, setModal] = useState(null)
  const [registerForm, setRegisterForm] = useState({ full_name: '', phone: '', group: '', course_price: '', booking_amount: '', amount: '', assistant_name: '', comment: '', contract_status: 'unknown' })
  const [moneyForm, setMoneyForm] = useState({ amount: '', kind: 'payment' })
  const [editForm, setEditForm] = useState(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cashier-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['cashier-students'] })
  }
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({ queryKey: ['cashier-dashboard'], queryFn: cashierAPI.getDashboard })
  const { data: groupsResponse } = useQuery({ queryKey: ['cashier-groups'], queryFn: () => groupsAPI.getList({ status: 'active' }) })
  const { data: studentsResponse, isLoading: studentsLoading } = useQuery({
    queryKey: ['cashier-students', deferredSearch, paymentStatus],
    queryFn: () => studentsAPI.getList({ ...(deferredSearch && { search: deferredSearch }), ...(paymentStatus && { payment_status: paymentStatus }) }),
  })
  const { data: historyResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['cashier-history', selectedStudent?.id],
    queryFn: () => studentsAPI.getHistory(selectedStudent.id),
    enabled: Boolean(selectedStudent?.id),
  })

  const registerMutation = useMutation({
    mutationFn: (payload) => studentsAPI.register(payload, freshKey()),
    onSuccess: (response) => {
      toast.success(response.replayed ? 'Заявка уже была обработана' : 'Ученик зарегистрирован')
      refresh(); setModal(null); setRegisterForm({ full_name: '', phone: '', group: '', course_price: '', booking_amount: '', amount: '', assistant_name: '', comment: '', contract_status: 'unknown' })
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Не удалось зарегистрировать ученика'),
  })
  const moneyMutation = useMutation({
    mutationFn: ({ student, form }) => (form.kind === 'booking'
      ? studentsAPI.addBooking(student.id, { amount: form.amount }, freshKey())
      : studentsAPI.makePayment(student.id, { amount: form.amount }, freshKey())),
    onSuccess: (response) => { toast.success(response.replayed ? 'Операция уже была обработана' : 'Оплата сохранена'); refresh(); setModal(null); setMoneyForm({ amount: '', kind: 'payment' }) },
    onError: (error) => toast.error(error.response?.data?.detail || 'Не удалось принять оплату'),
  })
  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => studentsAPI.updateDetails(id, payload),
    onSuccess: (student) => { setSelectedStudent(student); setEditForm(student); refresh(); setModal(null); toast.success('Данные ученика обновлены') },
    onError: () => toast.error('Не удалось сохранить изменения'),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => studentsAPI.changeStatus(id, status),
    onSuccess: (student) => { setSelectedStudent(student); refresh(); toast.success('Статус обновлён') },
    onError: () => toast.error('Не удалось изменить статус'),
  })
  const transferMutation = useMutation({
    mutationFn: ({ id, group }) => studentsAPI.transferGroup(id, group),
    onSuccess: () => { refresh(); setModal(null); toast.success('Ученик переведён в другую группу') },
    onError: (error) => toast.error(error.response?.data?.detail || 'Не удалось перевести ученика'),
  })

  const groups = studentList(groupsResponse)
  const students = studentList(studentsResponse)
  const history = studentList(historyResponse)
  const stats = useMemo(() => [
    ['Баланс кассы', dashboard?.balance, 'bg-emerald-50 text-emerald-700'],
    ['Принято сегодня', dashboard?.today_received, 'bg-sky-50 text-sky-700'],
    ['Принято за месяц', dashboard?.month_received, 'bg-violet-50 text-violet-700'],
    ['Ученики с долгом', dashboard?.debt_students_count ?? '—', 'bg-amber-50 text-amber-700'],
  ], [dashboard])

  const openStudent = (student) => { setSelectedStudent(student); setEditForm(student) }
  const submitRegistration = (event) => {
    event.preventDefault()
    registerMutation.mutate({
      ...registerForm,
      course_price: registerForm.course_price || null,
      booking_amount: registerForm.booking_amount || '0', amount: registerForm.amount || '0',
    })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="page-title">Касса</h1><p className="page-subtitle">Регистрация, оплаты и контроль учеников</p></div>
        <button className="btn btn-primary" onClick={() => setModal('register')}><UserPlusIcon className="h-5 w-5" /> Быстрая регистрация</button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, color]) => <div key={label} className={`rounded-2xl p-5 ${color}`}><p className="text-sm font-semibold opacity-80">{label}</p><p className="mt-2 text-2xl font-extrabold">{label === 'Ученики с долгом' ? value : formatCurrency(value || 0)}</p></div>)}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-lg font-bold text-slate-900">Ученики</h2><p className="mt-1 text-sm text-slate-500">Поиск работает на сервере по имени и телефону</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" /><input className="input w-full pl-10 sm:w-64" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Имя или телефон" /></label>
            <select className="input sm:w-44" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="">Все оплаты</option><option value="debt">Есть долг</option><option value="paid">Оплачено</option><option value="overpaid">Переплата</option><option value="unknown">Без цены</option></select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table"><thead><tr><th>Ученик</th><th>Группа</th><th>Курс</th><th>Оплачено</th><th>Остаток</th><th>Статус оплаты</th><th></th></tr></thead>
            <tbody>{studentsLoading ? <tr><td colSpan="7" className="py-12 text-center text-slate-500">Загрузка…</td></tr> : students.length === 0 ? <tr><td colSpan="7" className="py-12 text-center text-slate-500">Ученики не найдены</td></tr> : students.map((student) => <tr key={student.id} onClick={() => openStudent(student)}><td><div className="font-semibold text-slate-900">{student.full_name}</div><div className="mt-1 text-xs text-slate-500">{student.phone || 'Телефон не указан'}</div></td><td>{student.group_name}</td><td>{student.course_price ? formatCurrency(student.course_price) : '—'}</td><td className="font-semibold text-emerald-700">{formatCurrency(student.amount_paid_total)}</td><td className={amount(student.remaining_balance) > 0 ? 'font-semibold text-amber-700' : ''}>{student.remaining_balance === null ? '—' : formatCurrency(student.remaining_balance)}</td><td><PaymentStatus value={student.payment_status} /></td><td><button className="btn btn-secondary !px-3 !py-2" onClick={(event) => { event.stopPropagation(); openStudent(student) }}>Карточка</button></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      {selectedStudent && <section className="card p-6"><div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-3"><h2 className="text-xl font-extrabold text-slate-900">{selectedStudent.full_name}</h2><PaymentStatus value={selectedStudent.payment_status} /></div><p className="mt-2 text-sm text-slate-500">{selectedStudent.phone || 'Телефон не указан'} · {selectedStudent.group_name}</p></div><button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={() => setSelectedStudent(null)}><XMarkIcon className="h-6 w-6" /></button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Цена курса</p><p className="mt-1 font-bold">{selectedStudent.course_price ? formatCurrency(selectedStudent.course_price) : 'Не задана'}</p></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold text-emerald-700">Всего оплачено</p><p className="mt-1 font-bold text-emerald-800">{formatCurrency(selectedStudent.amount_paid_total)}</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-semibold text-amber-700">Остаток</p><p className="mt-1 font-bold text-amber-800">{selectedStudent.remaining_balance === null ? '—' : formatCurrency(selectedStudent.remaining_balance)}</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2"><button className="btn btn-primary" onClick={() => setModal('payment')}><BanknotesIcon className="h-5 w-5" /> Принять оплату</button><button className="btn btn-secondary" onClick={() => { setMoneyForm({ amount: '', kind: 'booking' }); setModal('payment') }}><PlusIcon className="h-5 w-5" /> Бронь</button><button className="btn btn-secondary" onClick={() => setModal('edit')}><PencilSquareIcon className="h-5 w-5" /> Изменить данные</button><button className="btn btn-secondary" onClick={() => setModal('transfer')}><ArrowsRightLeftIcon className="h-5 w-5" /> Перевести</button><select className="input w-auto" value={selectedStudent.status} onChange={(event) => statusMutation.mutate({ id: selectedStudent.id, status: event.target.value })}><option value="active">Активный</option><option value="debt">Долг</option><option value="frozen">Заморожен</option><option value="expelled">Отчислен</option></select></div>
        <div className="mt-6"><h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><ClockIcon className="h-5 w-5" /> История оплат</h3>{historyLoading ? <p className="text-sm text-slate-500">Загрузка истории…</p> : <div className="space-y-2">{history.length ? history.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="font-semibold text-slate-800">{formatTransactionType(item.type)}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(item.created_at)}</p></div><p className="font-bold text-emerald-700">+{formatCurrency(item.amount)}</p></div>) : <p className="text-sm text-slate-500">Оплат пока нет.</p>}</div>}</div>
      </section>}

      <section className="grid gap-5 lg:grid-cols-2"><div className="card p-5"><h2 className="mb-4 font-bold text-slate-900">Последние оплаты</h2><div className="space-y-3">{dashboardLoading ? <p className="text-sm text-slate-500">Загрузка…</p> : (dashboard?.recent_transactions || []).slice(0, 5).map((item) => <div key={item.id} className="flex justify-between"><div><p className="font-semibold text-slate-800">{item.student_name || item.student}</p><p className="text-xs text-slate-500">{formatTransactionType(item.type)} · {formatDateTime(item.created_at)}</p></div><p className="font-bold text-emerald-700">+{formatCurrency(item.amount)}</p></div>)}</div></div><div className="card p-5"><h2 className="mb-4 font-bold text-slate-900">Быстрый ориентир</h2><p className="text-sm leading-6 text-slate-600">Бронь и оплаты сохраняются отдельными транзакциями. Итог, долг и переплата рассчитываются сервером — вручную их изменить нельзя.</p></div></section>

      {modal === 'register' && <Modal title="Быстрая регистрация" onClose={() => setModal(null)}><form className="space-y-4 p-6" onSubmit={submitRegistration}><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">ФИО *</span><input className="input" required value={registerForm.full_name} onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })} /></label><label><span className="label">Телефон</span><input className="input" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} /></label></div><label><span className="label">Группа *</span><select className="input" required value={registerForm.group} onChange={(e) => setRegisterForm({ ...registerForm, group: e.target.value })}><option value="">Выберите группу</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-3"><label><span className="label">Цена курса</span><input className="input" type="number" min="0" value={registerForm.course_price} onChange={(e) => setRegisterForm({ ...registerForm, course_price: e.target.value })} /></label><label><span className="label">Бронь</span><input className="input" type="number" min="0" value={registerForm.booking_amount} onChange={(e) => setRegisterForm({ ...registerForm, booking_amount: e.target.value })} /></label><label><span className="label">Первая оплата</span><input className="input" type="number" min="0" value={registerForm.amount} onChange={(e) => setRegisterForm({ ...registerForm, amount: e.target.value })} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Ассистент</span><input className="input" value={registerForm.assistant_name} onChange={(e) => setRegisterForm({ ...registerForm, assistant_name: e.target.value })} /></label><label><span className="label">Статус договора</span><select className="input" value={registerForm.contract_status} onChange={(e) => setRegisterForm({ ...registerForm, contract_status: e.target.value })}><option value="unknown">Не указан</option><option value="signed">Подписан</option><option value="not_signed">Не подписан</option></select></label></div><label><span className="label">Комментарий</span><textarea className="input" rows="2" value={registerForm.comment} onChange={(e) => setRegisterForm({ ...registerForm, comment: e.target.value })} /></label><div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Отмена</button><button className="btn btn-primary" disabled={registerMutation.isPending}>Зарегистрировать</button></div></form></Modal>}
      {modal === 'payment' && <Modal title={moneyForm.kind === 'booking' ? 'Принять бронь' : 'Принять оплату'} onClose={() => setModal(null)}><form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); moneyMutation.mutate({ student: selectedStudent, form: moneyForm }) }}><label><span className="label">Сумма *</span><input autoFocus required className="input" type="number" min="0.01" step="0.01" value={moneyForm.amount} onChange={(e) => setMoneyForm({ ...moneyForm, amount: e.target.value })} /></label><p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Операция будет записана как отдельная транзакция и увеличит баланс кассира.</p><div className="flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Отмена</button><button className="btn btn-primary" disabled={moneyMutation.isPending}>Сохранить</button></div></form></Modal>}
      {modal === 'edit' && <Modal title="Данные ученика" onClose={() => setModal(null)}><form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); editMutation.mutate({ id: selectedStudent.id, payload: editForm }) }}><label><span className="label">ФИО</span><input className="input" value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Телефон</span><input className="input" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></label><label><span className="label">Ассистент</span><input className="input" value={editForm.assistant_name || ''} onChange={(e) => setEditForm({ ...editForm, assistant_name: e.target.value })} /></label></div><label><span className="label">Статус договора</span><select className="input" value={editForm.contract_status || 'unknown'} onChange={(e) => setEditForm({ ...editForm, contract_status: e.target.value })}><option value="unknown">Не указан</option><option value="signed">Подписан</option><option value="not_signed">Не подписан</option></select></label><label><span className="label">Комментарий</span><textarea className="input" rows="3" value={editForm.comment || ''} onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })} /></label><div className="flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Отмена</button><button className="btn btn-primary" disabled={editMutation.isPending}>Сохранить</button></div></form></Modal>}
      {modal === 'transfer' && <Modal title="Перевод в группу" onClose={() => setModal(null)}><form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); transferMutation.mutate({ id: selectedStudent.id, group: new FormData(e.currentTarget).get('group') }) }}><label><span className="label">Новая группа</span><select name="group" className="input" required defaultValue=""><option value="" disabled>Выберите группу</option>{groups.filter((group) => group.id !== selectedStudent.group).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><div className="flex justify-end gap-3"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Отмена</button><button className="btn btn-primary" disabled={transferMutation.isPending}>Перевести</button></div></form></Modal>}
    </div>
  )
}
