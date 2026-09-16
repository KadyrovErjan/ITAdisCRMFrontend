import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import CountUp from 'react-countup';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ChartBarIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const [dateRange, setDateRange] = useState({ date_from: '', date_to: '' });

  // Queries с кэшированием
  const { data: summary, isLoading: loadingSummary, refetch } = useQuery({
    queryKey: ['analytics', 'summary', dateRange],
    queryFn: () => analyticsAPI.getSummary(dateRange),
    staleTime: 30000, // Кэш 30 секунд
  });

  const { data: monthly, isLoading: loadingMonthly } = useQuery({
    queryKey: ['analytics', 'monthly', dateRange],
    queryFn: () => analyticsAPI.getMonthly(dateRange),
    staleTime: 30000,
  });

  const { data: groupStats } = useQuery({
    queryKey: ['analytics', 'groups'],
    queryFn: () => analyticsAPI.getGroups(),
    staleTime: 60000, // Кэш 1 минута
  });

  // Форматирование в сомах
  const formatSom = (value) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' сом';
  };

  // Преобразование данных
  const monthlyChartData = monthly?.map(item => ({
    month: item.month,
    income: parseFloat(item.income) || 0,
    expense: parseFloat(item.expense) || 0,
  })) || [];

  if (loadingSummary || loadingMonthly) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Загружаем аналитику...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Аналитика</h1>
          <p className="mt-1 text-text-secondary">Финансовая статистика</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="btn btn-secondary"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Обновить
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Дата начала</label>
            <input
              type="date"
              className="input"
              value={dateRange.date_from}
              onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Дата окончания</label>
            <input
              type="date"
              className="input"
              value={dateRange.date_to}
              onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ date_from: '', date_to: '' })}
              className="btn btn-ghost w-full"
            >
              Очистить
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Общий доход</p>
              <h3 className="text-2xl font-bold text-success-600 mt-1">
                <CountUp 
                  end={parseFloat(summary?.total_income || 0)} 
                  duration={1.5} 
                  separator=" " 
                  suffix=" сом"
                />
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100">
              <BanknotesIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Общий расход</p>
              <h3 className="text-2xl font-bold text-error-600 mt-1">
                <CountUp 
                  end={parseFloat(summary?.total_expense || 0)} 
                  duration={1.5} 
                  separator=" " 
                  suffix=" сом"
                />
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-100">
              <ChartBarIcon className="h-6 w-6 text-error-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Чистая прибыль</p>
              <h3 className="text-2xl font-bold text-primary-600 mt-1">
                <CountUp 
                  end={parseFloat(summary?.net_profit || 0)} 
                  duration={1.5} 
                  separator=" " 
                  suffix=" сом"
                />
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
              <AcademicCapIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Chart */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Динамика доходов и расходов
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip 
              formatter={(value) => formatSom(value)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10B981" name="Доход" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" fill="#EF4444" name="Расход" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Groups Table */}
      {groupStats && groupStats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">Статистика по группам</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Предмет</th>
                  <th>Учеников</th>
                  <th>Собрано</th>
                  <th>Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {groupStats.map((group) => (
                  <tr key={group.group_id}>
                    <td className="font-medium">{group.group_name}</td>
                    <td>{group.subject}</td>
                    <td>{group.student_count}</td>
                    <td className="font-semibold text-success-600">
                      {formatSom(parseFloat(group.total_collected))}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${group.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {group.progress_percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
