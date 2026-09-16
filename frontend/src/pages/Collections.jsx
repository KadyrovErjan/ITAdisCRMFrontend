import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionsAPI, balancesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/format';
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const Collections = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    from_user: '',
    amount: '',
  });

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsAPI.getList(),
  });

  const { data: balances } = useQuery({
    queryKey: ['balances'],
    queryFn: () => balancesAPI.getList(),
  });

  const { data: myBalance } = useQuery({
    queryKey: ['balance', 'me'],
    queryFn: () => balancesAPI.getMine(),
    enabled: currentUser?.role !== 'director', // Не загружать для директора
  });

  const createMutation = useMutation({
    mutationFn: (data) => collectionsAPI.create({
      ...data,
      amount: parseFloat(data.amount),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
      queryClient.invalidateQueries(['balance']);
      setIsModalOpen(false);
      setFormData({ from_user: '', amount: '' });
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Бухгалтер принимает деньги только у кассиров, директор — у кассиров и бухгалтеров.
  const availableUsers = balances?.results?.filter(
    (balance) => currentUser?.role === 'director'
      ? ['cashier', 'accountant'].includes(balance.user_role)
      : balance.user_role === 'cashier'
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Акча чогултуу</h1>
          <p className="page-subtitle">Кассирден же бухгалтерден каражатты коопсуз кабыл алуу</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Новый сбор
        </button>
      </div>

      {/* Текущий баланс - только для бухгалтера */}
      {currentUser?.role !== 'director' && (
        <div className="card border-[#bde3cb] bg-[#e7f5ec] p-4">
          <p className="text-sm text-[#216d42]">
            Ваш текущий баланс: <span className="font-bold">{formatCurrency(myBalance?.amount || 0)}</span>
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto"><table className="data-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  От кого
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Кому
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {collections?.results?.map((collection) => (
                <tr key={collection.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(collection.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {collection.from_user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ArrowRightIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{collection.to_user_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(collection.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Модальное окно создания сбора */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 py-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Создать сбор денег
                  </h3>
                  <div className="space-y-4">
                    {currentUser?.role !== 'director' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                          Сиздин учурдагы балансыңыз: <span className="font-bold">{formatCurrency(myBalance?.amount || 0)}</span>
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        От кого собрать
                      </label>
                      <select
                        name="from_user"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.from_user}
                        onChange={handleChange}
                      >
                        <option value="">Кызматкерди тандаңыз</option>
                        {availableUsers.map((user) => (
                          <option key={user.user} value={user.user}>
                            {user.user_name} ({user.user_role === 'cashier' ? 'Кассир' : 'Бухгалтер'}) - {formatCurrency(user.amount)} сом
                          </option>
                        ))}
                      </select>
                      
                      {/* Показываем баланс выбранного пользователя */}
                      {formData.from_user && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Баланс работника:</span>{' '}
                            <span className="font-bold text-lg">
                              {formatCurrency(
                                availableUsers.find(u => u.user === formData.from_user)?.amount || 0
                              )} сом
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Сумма (сом)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        required
                        min="0.01"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.amount}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  {createMutation.isError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800">
                        {createMutation.error?.response?.data?.detail || 'Ошибка при создании сбора'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isLoading ? 'Создание...' : 'Создать сбор'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
