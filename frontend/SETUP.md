# ITadis CRM Frontend - Инструкция по запуску

## Требования

- Node.js 18+ и npm (или yarn)
- Backend должен быть запущен на http://localhost:8000

## Установка и запуск

### 1. Установка зависимостей

```bash
cd frontend
npm install
```

### 2. Настройка окружения

Файл `.env` уже создан со стандартными настройками:

```
VITE_API_URL=http://localhost:8000/api/v1
```

Если backend работает на другом порту, измените URL в `.env`.

### 3. Запуск приложения

```bash
npm run dev
```

Приложение откроется на http://localhost:5173

## Тестовые пользователи

После создания тестовых данных в backend вы можете войти со следующими учетными данными:

- **Администратор**: `admin` / `admin123`
- **Директор**: `director` / `director123`
- **Бухгалтер**: `accountant` / `accountant123`
- **Кассир**: `cashier1` / `cashier123`

## Структура проекта

```
frontend/
├── src/
│   ├── components/          # Компоненты (Layout, Sidebar, Header)
│   ├── pages/              # Страницы приложения
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Groups.jsx
│   │   ├── Students.jsx
│   │   ├── Transactions.jsx
│   │   ├── Balances.jsx
│   │   ├── Collections.jsx
│   │   ├── Expenses.jsx
│   │   ├── Analytics.jsx
│   │   ├── Users.jsx
│   │   └── Profile.jsx
│   ├── services/           # API сервисы
│   │   └── api.js
│   ├── store/              # Zustand state management
│   │   └── authStore.js
│   ├── utils/              # Утилиты
│   │   ├── format.js
│   │   └── validation.js
│   ├── App.jsx             # Роутинг
│   ├── main.jsx            # Точка входа
│   └── index.css           # Глобальные стили
├── .env                    # Переменные окружения
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Функциональность по ролям

### Кассир (Cashier)
- Главная страница с балансом
- Создание групп
- Регистрация учеников
- Доплаты за учеников
- Просмотр своих транзакций
- Профиль

### Бухгалтер (Accountant)
- Все функции кассира +
- Просмотр всех транзакций
- Просмотр балансов сотрудников
- Сборы денег
- Расходы
- Профиль

### Директор (Director)
- Все функции бухгалтера +
- Аналитика с графиками
- Экспорт отчетов в Excel
- Журнал аудита
- Профиль

### Администратор (Admin)
- Все функции директора +
- Управление пользователями (создание, редактирование, удаление)
- Профиль

## Основные технологии

- **React 18** - UI библиотека
- **Vite** - Build tool
- **React Router 6** - Роутинг
- **TanStack Query** - Управление серверным состоянием
- **Zustand** - State management для аутентификации
- **Axios** - HTTP клиент
- **Tailwind CSS** - Стили
- **Heroicons** - Иконки
- **Recharts** - Графики для аналитики
- **React Hot Toast** - Уведомления

## Команды

```bash
# Запуск dev сервера
npm run dev

# Сборка для production
npm run build

# Предпросмотр production сборки
npm run preview

# Линтинг
npm run lint
```

## API Integration

Приложение автоматически:
- Добавляет JWT токен к каждому запросу
- Обновляет токен при истечении
- Перенаправляет на login при 401 ошибке
- Показывает понятные сообщения об ошибках

## Troubleshooting

### Backend недоступен

Убедитесь что backend запущен:
```bash
cd mysite
docker-compose up -d
```

Проверьте логи backend:
```bash
docker-compose logs -f web
```

### Проблемы с зависимостями

Удалите node_modules и переустановите:
```bash
rm -rf node_modules package-lock.json
npm install
```

### CORS ошибки

Убедитесь что backend настроен для CORS:
- В `mysite/mysite/settings.py` должен быть `django-cors-headers`
- `CORS_ALLOWED_ORIGINS` должен включать `http://localhost:5173`

### Не работает автообновление токенов

Проверьте:
1. Refresh token сохраняется в localStorage
2. Backend endpoint `/api/v1/auth/refresh/` доступен
3. JWT настройки в backend корректны

## Дальнейшая разработка

Для добавления новых функций:

1. **Новая страница**: Создайте компонент в `src/pages/`
2. **Новый API эндпоинт**: Добавьте метод в `src/services/api.js`
3. **Новый компонент**: Создайте в `src/components/`
4. **Обновите роутинг**: Добавьте Route в `src/App.jsx`

## Поддержка

При возникновении проблем проверьте:
1. Backend запущен и доступен
2. Все зависимости установлены
3. `.env` файл создан и содержит правильный URL
4. Console браузера на наличие ошибок JavaScript
5. Network tab в DevTools на наличие failed requests
