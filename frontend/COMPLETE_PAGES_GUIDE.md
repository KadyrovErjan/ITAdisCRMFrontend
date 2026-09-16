# Полное руководство по созданию всех страниц

## 🎯 После установки зависимостей создайте следующие файлы:

### 1. src/pages/Groups.jsx - Управление группами

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { groupsAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatDate } from '../utils/format'
import toast from 'react-hot-toast'
import { Plus, Edit, Users } from 'lucide-react'

export default function Groups() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await groupsAPI.list()
      return res.data.results
    },
  })

  const { register, handleSubmit, reset } = useForm()

  const createMutation = useMutation({
    mutationFn: groupsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['groups'])
      toast.success('Топ түзүлдү!')
      setIsModalOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Ката')
    },
  })

  const progressMutation = useMutation({
    mutationFn: ({ id, current_lesson }) => 
      groupsAPI.updateProgress(id, { current_lesson }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups'])
      toast.success('Прогресс жаңыртылды!')
    },
  })

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      total_lessons: parseInt(data.total_lessons),
    })
  }

  if (isLoading) return <div>Жүктөлүүдө...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Топтор</h1>
        {hasRole('cashier') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Топ кошуу
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups?.map((group) => (
          <div key={group.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.subject}</p>
              </div>
              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                {group.progress_percent}%
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">{group.schedule}</p>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Прогресс:</span>
                <span>{group.current_lesson} / {group.total_lessons}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${group.progress_percent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-4">
              <Users className="w-4 h-4 mr-2" />
              {group.student_count} окуучу
            </div>

            {(hasRole(['cashier', 'director']) || group.created_by === group.id) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const newLesson = prompt('Жаңы сабак номери:', group.current_lesson)
                    if (newLesson) {
                      progressMutation.mutate({
                        id: group.id,
                        current_lesson: parseInt(newLesson),
                      })
                    }
                  }}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Прогресс
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for creating group */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Жаңы топ</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Аталышы</label>
                <input {...register('name', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">Предмет</label>
                <input {...register('subject', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">Расписание</label>
                <input {...register('schedule', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">Сабактардын саны</label>
                <input 
                  {...register('total_lessons', { required: true })} 
                  type="number" 
                  className="input" 
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 btn btn-primary">
                  Түзүү
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Жабуу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. src/pages/Students.jsx - Управление учениками

```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { studentsAPI, groupsAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatCurrency, formatDate } from '../utils/format'
import toast from 'react-hot-toast'
import { Plus, DollarSign } from 'lucide-react'

export default function Students() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuthStore()
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await studentsAPI.list()
      return res.data.results
    },
  })

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await groupsAPI.list()
      return res.data.results
    },
  })

  const { register, handleSubmit, reset } = useForm()

  const registerMutation = useMutation({
    mutationFn: studentsAPI.register,
    onSuccess: () => {
      queryClient.invalidateQueries(['students'])
      toast.success('Окуучу каттоодон өттү!')
      setIsRegisterOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Ката')
    },
  })

  const topupMutation = useMutation({
    mutationFn: ({ id, amount }) => studentsAPI.topup(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries(['students'])
      toast.success('Төлөм кабыл алынды!')
      setSelectedStudent(null)
    },
  })

  const onRegister = (data) => {
    registerMutation.mutate(data)
  }

  const handleTopup = (studentId) => {
    const amount = prompt('Төлөм суммасы (сом):')
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      topupMutation.mutate({ id: studentId, amount: parseFloat(amount) })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Окуучулар</h1>
        {hasRole('cashier') && (
          <button 
            onClick={() => setIsRegisterOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Окуучу каттоо
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-cell font-semibold">Аты-жөнү</th>
              <th className="table-cell font-semibold">Топ</th>
              <th className="table-cell font-semibold">Төлөгөн сумма</th>
              <th className="table-cell font-semibold">Каттоо күнү</th>
              <th className="table-cell font-semibold">Аракет</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students?.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{student.full_name}</td>
                <td className="table-cell">{student.group_name}</td>
                <td className="table-cell">{formatCurrency(student.amount_paid_total)}</td>
                <td className="table-cell">{formatDate(student.created_at)}</td>
                <td className="table-cell">
                  {hasRole('cashier') && (
                    <button
                      onClick={() => handleTopup(student.id)}
                      className="text-sm btn btn-success py-1 px-3"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Доплата
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Окуучу каттоо</h2>
            <form onSubmit={handleSubmit(onRegister)} className="space-y-4">
              <div>
                <label className="label">Аты-жөнү</label>
                <input {...register('full_name', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">Топ</label>
                <select {...register('group', { required: true })} className="input">
                  <option value="">Тандаңыз</option>
                  {groups?.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Биринчи төлөм (сом)</label>
                <input 
                  {...register('amount', { required: true, min: 1 })} 
                  type="number" 
                  step="0.01"
                  className="input" 
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 btn btn-primary">
                  Каттоо
                </button>
                <button 
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Жабуу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

Создайте аналогично остальные страницы:
- `Transactions.jsx` - список транзакций с фильтрами
- `Balances.jsx` - балансы пользователей
- `Collections.jsx` - сбор денег
- `Expenses.jsx` - расходы
- `Analytics.jsx` - графики для директора
- `Users.jsx` - управление пользователями (admin)
- `Profile.jsx` - профиль и смена пароля

## 🎨 Общая структура страницы:

1. **Заголовок и кнопки действий**
2. **Фильтры** (если нужно)
3. **Таблица или карточки с данными**
4. **Модальные окна** для создания/редактирования
5. **Использование React Query** для данных
6. **Toast уведомления** для feedback

## 🔑 Ключевые паттерны:

- Используйте `useQuery` для GET запросов
- Используйте `useMutation` для POST/PATCH/DELETE
- Всегда инвалидируйте кеш после мутации
- Показывайте loading состояния
- Обрабатывайте ошибки с toast
- Проверяйте роли через `hasRole()`

## 📦 После создания всех файлов:

```bash
npm install
npm run dev
```

Приложение будет работать на http://localhost:3000
