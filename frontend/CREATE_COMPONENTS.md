# Инструкция по созданию остальных компонентов

После установки зависимостей (`npm install`), создайте следующие файлы:

## src/components/Sidebar.jsx
```jsx
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  Home, Users, GraduationCap, Receipt, Wallet, 
  TrendingUp, DollarSign, BarChart3, UserCog, LogOut 
} from 'lucide-react'
import clsx from 'clsx'

export default function Sidebar() {
  const location = useLocation()
  const { user, hasRole, logout } = useAuthStore()

  const navigation = [
    { name: 'Башкы', href: '/', icon: Home, show: true },
    { name: 'Топтор', href: '/groups', icon: GraduationCap, show: true },
    { name: 'Окуучулар', href: '/students', icon: Users, show: true },
    { name: 'Транзакциялар', href: '/transactions', icon: Receipt, show: true },
    { name: 'Балансстар', href: '/balances', icon: Wallet, show: true },
    { name: 'Чогултуу', href: '/collections', icon: TrendingUp, show: hasRole(['accountant', 'director']) },
    { name: 'Чыгымдар', href: '/expenses', icon: DollarSign, show: hasRole(['accountant', 'director']) },
    { name: 'Аналитика', href: '/analytics', icon: BarChart3, show: hasRole('director') },
    { name: 'Колдонуучулар', href: '/users', icon: UserCog, show: hasRole('admin') },
  ]

  return (
    <div className="w-64 bg-primary-900 text-white flex flex-col">
      <div className="p-6 border-b border-primary-800">
        <h1 className="text-2xl font-bold">ITadis CRM</h1>
        <p className="text-sm text-primary-300 mt-1">{user?.full_name}</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => 
          item.show && (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'flex items-center px-4 py-3 rounded-lg transition-colors',
                location.pathname === item.href
                  ? 'bg-primary-800 text-white'
                  : 'text-primary-200 hover:bg-primary-800'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        )}
      </nav>
      
      <div className="p-4 border-t border-primary-800">
        <Link
          to="/profile"
          className="flex items-center px-4 py-3 rounded-lg text-primary-200 hover:bg-primary-800 transition-colors mb-2"
        >
          <UserCog className="w-5 h-5 mr-3" />
          Профиль
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-primary-200 hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Чыгуу
        </button>
      </div>
    </div>
  )
}
```

## src/components/Header.jsx
```jsx
import { useAuthStore } from '../store/authStore'
import { formatRole } from '../utils/format'
import { Bell } from 'lucide-react'

export default function Header() {
  const { user } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Кош келдиңиз, {user?.full_name}
          </h2>
          <p className="text-sm text-gray-500">{formatRole(user?.role)}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  )
}
```

## src/pages/Login.jsx
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await authAPI.login(data)
      const { access, refresh, user } = response.data
      setAuth(user, access, refresh)
      toast.success('Кирүү ийгиликтүү!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Кирүү катасы')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ITadis CRM</h1>
            <p className="text-gray-600">Системага кирүү</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label">Логин</label>
              <input
                {...register('login', { required: 'Логин талап кылынат' })}
                className="input"
                placeholder="Логиниңизди жазыңыз"
              />
              {errors.login && (
                <p className="mt-1 text-sm text-red-600">{errors.login.message}</p>
              )}
            </div>

            <div>
              <label className="label">Сырсөз</label>
              <input
                {...register('password', { required: 'Сырсөз талап кылынат' })}
                type="password"
                className="input"
                placeholder="Сырсөзүңүздү жазыңыз"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? (
                'Күтүңүз...'
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Кирүү
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

## src/pages/Dashboard.jsx
```jsx
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { balancesAPI, groupsAPI, transactionsAPI, analyticsAPI } from '../services/api'
import { formatCurrency } from '../utils/format'
import { Wallet, Users, Receipt, TrendingUp } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, hasRole } = useAuthStore()

  const { data: balance } = useQuery({
    queryKey: ['balance', 'me'],
    queryFn: async () => {
      const res = await balancesAPI.me()
      return res.data
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const res = await analyticsAPI.summary()
      return res.data
    },
    enabled: hasRole('director'),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Башкы бет</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Менин балансым"
          value={formatCurrency(balance?.amount || 0)}
          icon={Wallet}
          color="green"
        />

        {hasRole(['accountant', 'director']) && summary && (
          <>
            <StatCard
              title="Жалпы киреше"
              value={formatCurrency(summary.total_income)}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Жалпы чыгым"
              value={formatCurrency(summary.total_expense)}
              icon={Receipt}
              color="red"
            />
            <StatCard
              title="Таза пайда"
              value={formatCurrency(summary.net_profit)}
              icon={TrendingUp}
              color="purple"
            />
          </>
        )}
      </div>

      {/* Add more dashboard content */}
    </div>
  )
}
```

Создайте аналогично остальные страницы (Groups, Students, Transactions, etc.) следуя той же структуре.

## Общий шаблон страницы:
1. Заголовок
2. Кнопки действий (создать, экспорт)
3. Фильтры
4. Таблица с данными
5. Пагинация
6. Модальные окна для создания/редактирования

Используйте:
- `useQuery` для получения данных
- `useMutation` для создания/обновления
- `react-hook-form` для форм
- `toast` для уведомлений
- Tailwind CSS для стилей
