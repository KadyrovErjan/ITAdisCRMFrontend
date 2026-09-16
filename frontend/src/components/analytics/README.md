# 📊 Компоненты аналитики с анимациями

Современные React-компоненты для визуализации данных с впечатляющими анимациями и интерактивными элементами.

## 🎨 Компоненты

### AnimatedStatCard
Анимированная карточка статистики с градиентным фоном и эффектами.

**Пропсы:**
- `title` (string) - Заголовок карточки
- `value` (number/string) - Значение для отображения
- `icon` (Component) - React-компонент иконки
- `gradient` (string) - CSS класс для градиента
- `delay` (number) - Задержка анимации в секундах
- `prefix` (string) - Префикс для значения
- `suffix` (string) - Суффикс для значения

**Пример:**
```jsx
<AnimatedStatCard
  title="Общий доход"
  value={150000}
  icon={BanknotesIcon}
  gradient="bg-gradient-to-br from-green-400 to-emerald-600"
  delay={0}
  suffix=" ₸"
/>
```

### StatCardWithTrend
Карточка статистики с индикатором тренда и процентом изменения.

**Пропсы:**
- Все пропсы от `AnimatedStatCard`
- `previousValue` (number) - Предыдущее значение для расчета тренда

**Пример:**
```jsx
<StatCardWithTrend
  title="Чистая прибыль"
  value={80000}
  previousValue={70000}
  icon={ArrowTrendingUpIcon}
  gradient="bg-gradient-to-br from-blue-400 to-indigo-600"
  suffix=" ₸"
/>
```

### AnimatedChart
Анимированный график с поддержкой трех типов: area, line, bar.

**Пропсы:**
- `data` (array) - Массив данных для графика
- `type` (string) - Тип графика: 'area', 'line', 'bar'
- `title` (string) - Заголовок графика
- `description` (string) - Описание графика

**Формат данных:**
```javascript
[
  { month: '2024-01', income: 100000, expense: 50000 },
  { month: '2024-02', income: 120000, expense: 60000 }
]
```

**Пример:**
```jsx
<AnimatedChart
  data={monthlyData}
  type="area"
  title="Динамика доходов и расходов"
  description="Помесячная статистика"
/>
```

### AnimatedPieChart
Интерактивная круговая диаграмма с легендой.

**Пропсы:**
- `data` (array) - Массив данных
- `title` (string) - Заголовок
- `description` (string) - Описание
- `dataKey` (string) - Ключ для значений (по умолчанию 'value')
- `nameKey` (string) - Ключ для имен (по умолчанию 'name')

**Формат данных:**
```javascript
[
  { name: 'Категория 1', value: 30000 },
  { name: 'Категория 2', value: 20000 }
]
```

### LoadingSpinner
Красивый анимированный загрузчик.

**Пропсы:**
- `message` (string) - Сообщение загрузки

**Пример:**
```jsx
<LoadingSpinner message="Загружаем данные..." />
```

### ErrorState
Компонент для отображения ошибок.

**Пропсы:**
- `message` (string) - Сообщение об ошибке
- `onRetry` (function) - Функция для повторной попытки

**Пример:**
```jsx
<ErrorState
  message="Не удалось загрузить данные"
  onRetry={() => refetch()}
/>
```

### EmptyState
Компонент для отображения пустого состояния.

**Пропсы:**
- `title` (string) - Заголовок
- `message` (string) - Сообщение

**Пример:**
```jsx
<EmptyState
  title="Нет данных"
  message="Добавьте первую транзакцию"
/>
```

## 🎯 Особенности

### Анимации
- **Framer Motion** - плавные анимации появления и взаимодействия
- **CountUp** - анимированный счетчик чисел
- **Hover эффекты** - масштабирование и вращение при наведении
- **Sparkle эффекты** - мерцающие точки
- **Gradient анимации** - движущиеся градиенты

### Дизайн
- **Градиенты** - яркие цветовые переходы
- **Glass morphism** - эффект матового стекла
- **Shadows** - глубокие тени для объема
- **Responsive** - адаптивный дизайн для всех экранов

### Интерактивность
- **Tooltips** - кастомные всплывающие подсказки
- **Hover states** - интерактивные состояния
- **Smooth transitions** - плавные переходы
- **Loading states** - состояния загрузки

## 🚀 Использование

```jsx
import {
  AnimatedStatCard,
  AnimatedChart,
  AnimatedPieChart,
  LoadingSpinner,
  ErrorState,
  EmptyState
} from '../components/analytics';

function Analytics() {
  const { data, isLoading, error } = useQuery('analytics', fetchData);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!data) return <EmptyState />;
  
  return (
    <div>
      <AnimatedStatCard {...statsProps} />
      <AnimatedChart {...chartProps} />
      <AnimatedPieChart {...pieProps} />
    </div>
  );
}
```

## 🎨 Цветовая палитра

### Градиенты
- **Зеленый** (доход): `from-green-400 via-green-500 to-emerald-600`
- **Красный** (расход): `from-red-400 via-red-500 to-rose-600`
- **Синий** (прибыль): `from-blue-400 via-blue-500 to-indigo-600`
- **Фиолетовый** (группы): `from-purple-400 via-purple-500 to-violet-600`

### Цвета диаграмм
```javascript
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];
```

## 📦 Зависимости

- `framer-motion` - анимации
- `react-countup` - анимация чисел
- `recharts` - графики
- `@heroicons/react` - иконки
- `tailwindcss` - стили

## 🎬 Эффекты

### Появление компонентов
```javascript
initial={{ opacity: 0, y: 50, scale: 0.9 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.6, type: "spring" }}
```

### Hover эффекты
```javascript
whileHover={{ scale: 1.05, rotate: 1 }}
```

### Фоновые анимации
```javascript
animate={{
  background: [
    'radial-gradient(...)',
    'radial-gradient(...)',
  ]
}}
transition={{ duration: 5, repeat: Infinity }}
```

## 🏆 WOW-факторы

1. ✨ **Мерцающие эффекты** - sparkle анимации на карточках
2. 🌊 **Волновые градиенты** - движущиеся цветовые переходы
3. 🎭 **Glass morphism** - эффект матового стекла
4. 📈 **Smooth charts** - плавная анимация графиков
5. 🎨 **Rich colors** - яркая цветовая палитра
6. 🔄 **Smooth transitions** - плавные переходы между состояниями
7. 📱 **Responsive design** - адаптация под все устройства
8. 🎯 **Interactive tooltips** - информативные подсказки

---

**Создано с ❤️ для ITadis CRM**
