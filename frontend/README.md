# ITadis CRM Frontend

React frontend для системы кассово-бухгалтерского учёта учебного центра ITadis.

## 🚀 Быстрый старт

### Требования
- Node.js 18+ и npm

### Установка

```bash
# Установите зависимости
npm install

# Создайте .env файл
cp .env.example .env

# Запустите dev сервер
npm run dev
```

Приложение будет доступно на http://localhost:3000

## 📦 Скрипты

```bash
npm run dev      # Запуск dev сервера
npm run build    # Сборка для production
npm run preview  # Предпросмотр production сборки
npm run lint     # Проверка кода
```

## 🔑 Тестовые учётные записи

| Роль | Логин | Пароль | Доступ |
|------|-------|--------|--------|
| Администратор | admin | admin123 | Полный доступ |
| Директор | director | director123 | Аналитика, все операции |
| Бухгалтер | accountant | accountant123 | Сборы, расходы |
| Кассир | cashier1 | cashier123 | Регистрация, оплаты |

## 📱 Функционал по ролям

### 👤 Кассир (cashier)
- ✅ Создание и редактирование своих групп
- ✅ Регистрация учеников
- ✅ Приём оплаты от учеников
- ✅ Просмотр своих транзакций
- ✅ Просмотр своего баланса

### 💼 Бухгалтер (accountant)
- ✅ Просмотр всех данных (read-only)
- ✅ Сбор денег у кассиров
- ✅ Фиксация расходов
- ✅ Просмотр всех балансов

### 👔 Директор (director)
- ✅ Всё что у бухгалтера
- ✅ Полная аналитика с графиками
- ✅ Экспорт отчётов в Excel
- ✅ Редактирование всех групп

### ⚙️ Администратор (admin)
- ✅ Создание пользователей
- ✅ Назначение ролей
- ✅ Просмотр журнала аудита

## 🎨 Технологии

- **React 18** - UI библиотека
- **React Router v6** - Маршрутизация
- **Zustand** - State management
- **Axios** - HTTP клиент
- **TanStack Query** - Управление серверными данными
- **React Hook Form** - Формы
- **Tailwind CSS** - Стили
- **Lucide React** - Иконки
- **Recharts** - Графики
- **Vite** - Сборщик

## 📁 Структура проекта

```
src/
├── components/     # Переиспользуемые компоненты
│   ├── Layout.jsx
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   └── ...
├── pages/         # Страницы приложения
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Groups.jsx
│   └── ...
├── services/      # API клиенты
│   └── api.js
├── store/         # State management
│   └── authStore.js
├── utils/         # Утилиты
│   ├── format.js
│   └── validation.js
├── App.jsx        # Главный компонент
└── main.jsx       # Точка входа
```

## 🔐 Аутентификация

- JWT токены (access + refresh)
- Автоматическое обновление токенов
- Защищённые маршруты по ролям
- Автоматический logout при 401

## 🌍 Локализация

Интерфейс на кыргызском языке с поддержкой русского.

## 🎯 Основные страницы

### Главная (/dashboard)
- Статистика по роли пользователя
- Быстрые действия
- Графики (для director)

### Группы (/groups)
- Список групп с прогрессом
- Создание новой группы
- Обновление прогресса занятий
- Просмотр учеников

### Ученики (/students)
- Список всех учеников
- Регистрация с первым платежом
- Приём доплаты
- История оплат

### Транзакции (/transactions)
- История всех операций
- Фильтры: даты, тип, группа
- Поиск по имени

### Балансы (/balances)
- Свой баланс
- Балансы всех сотрудников (если есть доступ)

### Сборы (/collections)
- Сбор денег у кассиров
- История сборов
- Фильтры

### Расходы (/expenses)
- Фиксация расходов
- История расходов
- Обязательный комментарий

### Аналитика (/analytics) - только Director
- Общая сводка
- Помесячная разбивка
- Графики доходов/расходов
- Топ кассиров
- Экспорт в Excel

### Пользователи (/users) - только Admin
- Список пользователей
- Создание нового сотрудника
- Изменение роли
- Деактивация

## 🔧 Разработка

### Добавление новой страницы

1. Создайте компонент в `src/pages/`
2. Добавьте маршрут в `App.jsx`
3. Добавьте пункт в `Sidebar.jsx`
4. Добавьте API методы в `services/api.js`

### Работа с API

```jsx
import { useQuery, useMutation } from '@tanstack/react-query'
import { groupsAPI } from '../services/api'

// Получение данных
const { data, isLoading } = useQuery({
  queryKey: ['groups'],
  queryFn: async () => {
    const res = await groupsAPI.list()
    return res.data
  },
})

// Создание/обновление
const mutation = useMutation({
  mutationFn: groupsAPI.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['groups'])
    toast.success('Группа создана!')
  },
})
```

### Работа с формами

```jsx
import { useForm } from 'react-hook-form'

const { register, handleSubmit, formState: { errors } } = useForm()

const onSubmit = (data) => {
  mutation.mutate(data)
}
```

## 📊 Графики (Recharts)

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

<LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="income" stroke="#10b981" />
  <Line type="monotone" dataKey="expense" stroke="#ef4444" />
</LineChart>
```

## 🐛 Отладка

1. Проверьте консоль браузера
2. Проверьте Network вкладку для API запросов
3. Проверьте React DevTools
4. Проверьте TanStack Query DevTools (добавьте в dev mode)

## 🚢 Production Deploy

```bash
# Сборка
npm run build

# Файлы в dist/ готовы к deploy
# Загрузите на хостинг (Vercel, Netlify, etc.)
```

### Environment Variables

Создайте `.env.production`:

```
VITE_API_URL=https://api.itadis.kg/api/v1
```

## 📝 TODO

- [ ] Добавить тесты (Jest + React Testing Library)
- [ ] Добавить Storybook для компонентов
- [ ] Добавить темную тему
- [ ] Добавить PWA support
- [ ] Добавить печать документов
- [ ] Добавить экспорт в PDF

## 🤝 Вклад

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Proprietary - ITadis Learning Center

## 👨‍💻 Разработка

Разработано для учебного центра ITadis, 2026
