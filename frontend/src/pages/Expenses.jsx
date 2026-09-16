import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesAPI, balancesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/format';
import { PlusIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';

const Expenses = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    comment: '',
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesAPI.getList(),
  });

  const { data: myBalance } = useQuery({
    queryKey: ['balance', 'me'],
    queryFn: () => balancesAPI.getMine(),
    enabled: user?.role !== 'director', // Не загружать для директора
  });

  const createMutation = useMutation({
    mutationFn: (data) => expensesAPI.create({
      ...data,
      amount: parseFloat(data.amount),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['balance']);
      setIsModalOpen(false);
      setFormData({ amount: '', comment: '' });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Расходы</h1>
          <p className="mt-1 text-sm text-gray-500">Учет расходов компании</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Добавить расход
        </button>
      </div>

      {/* Текущий баланс */}
      {/* Текущий баланс - только для бухгалтера */}
      {user?.role !== 'director' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Ваш текущий баланс: <span className="font-bold">{formatCurrency(myBalance?.amount || 0)}</span>
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Комментарий
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сотрудник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses?.results?.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {expense.comment || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.entered_by_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно создания расхода */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 py-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Добавить расход
                  </h3>
                  <div className="space-y-4">
                    {user?.role !== 'director' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                          Ваш текущий баланс: <span className="font-bold">{formatCurrency(myBalance?.amount || 0)}</span>
                        </p>
                      </div>
                    )}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Комментарий
                      </label>
                      <textarea
                        name="comment"
                        rows="3"
                        required
                        placeholder="Например: Зарплата Менторго"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.comment}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  {createMutation.isError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800">
                        {createMutation.error?.response?.data?.detail || 'Ошибка при создании расхода'}
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
                    {createMutation.isLoading ? 'Создание...' : 'Добавить расход'}
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

export default Expenses;
