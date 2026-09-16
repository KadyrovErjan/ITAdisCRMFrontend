import { useQuery } from '@tanstack/react-query';
import { balancesAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import { ScaleIcon } from '@heroicons/react/24/outline';

const Balances = () => {
  const { data: balances, isLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: () => balancesAPI.getList(),
  });

  // Фильтруем только кассиров и бухгалтеров (без директора)
  const balancesList = (balances?.results || []).filter(
    balance => balance.user_role !== 'director'
  );
  const totalBalance = balancesList.reduce((sum, balance) => sum + parseFloat(balance.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Балансы сотрудников</h1>
        <p className="mt-1 text-sm text-gray-500">Текущие балансы всех кассиров</p>
      </div>

      {/* Общая сумма */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-white bg-opacity-30 rounded-md p-3">
            <ScaleIcon className="h-8 w-8 text-white" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-blue-100">Общая сумма</p>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {balancesList.map((balance) => (
            <div
              key={balance.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <ScaleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {balance.user_name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(balance.amount)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Роль:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {balance.user_role === 'cashier' ? 'Кассир' :
                       balance.user_role === 'accountant' ? 'Бухгалтер' :
                       balance.user_role === 'director' ? 'Директор' : 'Администратор'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Обновлено:</span>
                    <span className="text-gray-900">
                      {new Date(balance.updated_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Balances;
