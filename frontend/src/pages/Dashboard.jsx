import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { balancesAPI, analyticsAPI, transactionsAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import {
  BanknotesIcon,
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuthStore();

  const { data: balance } = useQuery({
    queryKey: ['balance', 'me'],
    queryFn: () => balancesAPI.getMine(),
    enabled: user?.role !== 'director', // Не загружать баланс для директора
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsAPI.getSummary(),
    enabled: user?.role === 'director',
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => transactionsAPI.getList({ page_size: 5, ordering: '-created_at' }),
  });

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-xl p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
          <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
            <dd className="mt-1 text-xl font-extrabold text-[#0e2338]">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <h1 className="page-title">Кош келиңиз, {user?.full_name || user?.username}</h1>
        <p className="page-subtitle">
          Бүгүнкү финансылык абал жана акыркы операциялар.
        </p>
        </div>
        <div className="rounded-xl border border-[#bde3cb] bg-[#e7f5ec] px-3 py-2 text-xs font-semibold text-[#287a4a]">● Тутум иштеп жатат</div>
      </div>

      {/* Баланс пользователя */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Показываем баланс только для кассиров и бухгалтеров */}
        {user?.role !== 'director' && (
          <StatCard
            title="Мой баланс"
            value={formatCurrency(balance?.amount || 0)}
            icon={BanknotesIcon}
            color="bg-[#3fa76b]"
          />
        )}
        
        {user?.role === 'director' && analytics && (
          <>
            <StatCard
              title="Активные студенты"
              value={analytics.total_students || 0}
              icon={AcademicCapIcon}
              color="bg-[#39708f]"
            />
            <StatCard
              title="Активные группы"
              value={analytics.active_groups || 0}
              icon={UsersIcon}
              color="bg-[#6979b8]"
            />
            <StatCard
              title="Общий доход"
              value={formatCurrency(analytics.total_income || 0)}
              icon={ChartBarIcon}
              color="bg-[#16324f]"
            />
          </>
        )}
      </div>

      {/* Последние транзакции */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-[#0e2338]">Акыркы төлөмдөр</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Журнал</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ученик
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {recentTransactions?.results?.length > 0 ? (
                recentTransactions.results.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="rounded-full bg-[#e7f5ec] px-2.5 py-1 text-xs font-semibold text-[#287a4a]">{transaction.type === 'register' ? 'Каттоо' : 'Кошумча төлөм'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    Азырынча операциялар жок
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
