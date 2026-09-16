import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsAPI, groupsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/format';
import { PlusIcon, AcademicCapIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const Students = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    group: '',
    payment_amount: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsAPI.getList(),
  });

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getList(),
  });

  const registerMutation = useMutation({
    mutationFn: (data) => studentsAPI.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['balance']);
      setIsRegisterModalOpen(false);
      setRegisterForm({
        first_name: '',
        last_name: '',
        phone: '',
        group: '',
        payment_amount: '',
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ studentId, amount }) =>
      studentsAPI.makePayment(studentId, { amount: parseFloat(amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['balance']);
      setIsPaymentModalOpen(false);
      setSelectedStudent(null);
      setPaymentForm({ amount: '' });
    },
  });

  const handleRegisterChange = (e) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate({
      ...registerForm,
      payment_amount: parseFloat(registerForm.payment_amount),
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    paymentMutation.mutate({
      studentId: selectedStudent.id,
      amount: paymentForm.amount,
    });
  };

  const openPaymentModal = (student) => {
    setSelectedStudent(student);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ученики</h1>
          <p className="mt-1 text-sm text-gray-500">Регистрация и управление учениками</p>
        </div>
        {user?.role === 'cashier' && (
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Зарегистрировать ученика
          </button>
        )}
      </div>

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
                  Ученик
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Группа
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Оплачено
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Остаток
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                {user?.role === 'cashier' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students?.results?.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <AcademicCapIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.group_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(student.total_paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(student.remaining_balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {student.status === 'active' ? 'Активный' : 'Неактивный'}
                    </span>
                  </td>
                  {user?.role === 'cashier' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => openPaymentModal(student)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <BanknotesIcon className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно регистрации */}
      {isRegisterModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <form onSubmit={handleRegisterSubmit}>
                <div className="bg-white px-6 py-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Регистрация ученика
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Имя</label>
                      <input
                        type="text"
                        name="first_name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={registerForm.first_name}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Фамилия</label>
                      <input
                        type="text"
                        name="last_name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={registerForm.last_name}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Телефон</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={registerForm.phone}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Группа</label>
                      <select
                        name="group"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={registerForm.group}
                        onChange={handleRegisterChange}
                      >
                        <option value="">Выберите группу</option>
                        {groups?.results?.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name} - {formatCurrency(group.course_fee)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Сумма оплаты (сом)
                      </label>
                      <input
                        type="number"
                        name="payment_amount"
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={registerForm.payment_amount}
                        onChange={handleRegisterChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={registerMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {registerMutation.isLoading ? 'Регистрация...' : 'Зарегистрировать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно доплаты */}
      {isPaymentModalOpen && selectedStudent && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <form onSubmit={handlePaymentSubmit}>
                <div className="bg-white px-6 py-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Доплата: {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      Остаток к оплате: {formatCurrency(selectedStudent.remaining_balance)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Сумма доплаты (сом)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      setSelectedStudent(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={paymentMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {paymentMutation.isLoading ? 'Обработка...' : 'Внести оплату'}
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

export default Students;
