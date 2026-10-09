import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment } from 'react';
import { groupsAPI, studentsAPI, transactionsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PlusIcon, AcademicCapIcon, ChevronDownIcon, ChevronUpIcon, BanknotesIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import TechnologyIcon from '../components/TechnologyIcon';
import StudentDetails from '../components/StudentDetails';

const TECHNOLOGIES = ['Python', 'JavaScript', 'Flutter', 'Java', 'C#', 'UI/UX'];
const freshKey = () => globalThis.crypto?.randomUUID?.() || `groups-${Date.now()}-${Math.random()}`;
const WEEKDAYS = [
  { value: 'mon', label: 'Пн' }, { value: 'tue', label: 'Вт' }, { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' }, { value: 'fri', label: 'Пт' }, { value: 'sat', label: 'Сб' }, { value: 'sun', label: 'Вс' },
];
const newGroupForm = () => ({
  name: '', technology: 'Python', customTechnology: '', scheduleDays: [], scheduleTime: '',
  duration_months: '', start_date: '', end_date: '', total_lessons: '',
});

function addMonthsToIsoDate(startDate, months) {
  if (!startDate || !months) return '';
  const [year, month, day] = startDate.split('-').map(Number);
  const targetMonth = month - 1 + Number(months);
  // UTC avoids a local-timezone shift when serializing an HTML date input.
  const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, targetMonth, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

function serializeSchedule(days, time) {
  const labels = days.map((day) => WEEKDAYS.find((item) => item.value === day)?.label).filter(Boolean);
  return `${labels.join(', ')}${time ? ` · ${time}` : ''}`;
}

const Groups = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active'); // Фильтр по статусу
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailsError, setStudentDetailsError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedStudents, setExpandedStudents] = useState({});
  const [groupStudents, setGroupStudents] = useState({});
  const [studentTransactions, setStudentTransactions] = useState({});
  const [loadingStudents, setLoadingStudents] = useState({});
  const [loadingTransactions, setLoadingTransactions] = useState({});
  const [studentNameSearch, setStudentNameSearch] = useState('');
  const [groupFormData, setGroupFormData] = useState(newGroupForm);
  const [groupFormError, setGroupFormError] = useState('');
  const [isEndDateManual, setIsEndDateManual] = useState(false);
  const [technologyEditor, setTechnologyEditor] = useState(null);
  const [studentRegistrationKey, setStudentRegistrationKey] = useState(() => freshKey());
  const [studentFormData, setStudentFormData] = useState({ full_name: '', phone: '', first_payment_type: 'none', first_payment_amount: '0', course_price: '', assistant_name: '', contract_status: 'unknown', comment: '' });
  const [paymentFormData, setPaymentFormData] = useState({ amount: '' });

  const normalizedStudentNameSearch = studentNameSearch.trim();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', statusFilter, normalizedStudentNameSearch],
    queryFn: () => groupsAPI.getList({
      status: statusFilter,
      ...(normalizedStudentNameSearch && { student_name: normalizedStudentNameSearch }),
    })
  });

  const createGroupMutation = useMutation({
    mutationFn: (data) => groupsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      setIsGroupModalOpen(false);
      setGroupFormData(newGroupForm());
      setGroupFormError('');
      setIsEndDateManual(false);
    },
  });

  const updateTechnologyMutation = useMutation({
    mutationFn: ({ id, technology }) => groupsAPI.update(id, { technology }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setTechnologyEditor(null);
    },
  });

  const setGroupTiming = (patch) => {
    setGroupFormData((current) => {
      const next = { ...current, ...patch };
      if (!isEndDateManual && ('start_date' in patch || 'duration_months' in patch)) {
        next.end_date = addMonthsToIsoDate(next.start_date, next.duration_months);
      }
      return next;
    });
  };

  const toggleScheduleDay = (day) => {
    setGroupFormData((current) => ({
      ...current,
      scheduleDays: current.scheduleDays.includes(day)
        ? current.scheduleDays.filter((item) => item !== day)
        : [...current.scheduleDays, day],
    }));
  };

  const submitGroup = () => {
    const technology = groupFormData.technology === 'other'
      ? groupFormData.customTechnology.trim()
      : groupFormData.technology;
    if (!groupFormData.scheduleDays.length || !groupFormData.scheduleTime) {
      setGroupFormError('Выберите дни недели и укажите время занятий.');
      return;
    }
    if (!technology) {
      setGroupFormError('Укажите направление группы.');
      return;
    }
    setGroupFormError('');
    createGroupMutation.mutate({
      name: groupFormData.name.trim(), technology,
      // subject — legacy обязательное поле API. Значение технологии сохраняет
      // совместимость без второго противоречивого поля в интерфейсе.
      subject: technology,
      schedule: serializeSchedule(groupFormData.scheduleDays, groupFormData.scheduleTime),
      study_days_per_week: groupFormData.scheduleDays.length,
      duration_months: Number(groupFormData.duration_months),
      start_date: groupFormData.start_date,
      end_date: groupFormData.end_date || null,
      total_lessons: Number(groupFormData.total_lessons) || Math.max(groupFormData.scheduleDays.length * Number(groupFormData.duration_months) * 4, 1),
    });
  };

  const registerStudentMutation = useMutation({
    mutationFn: ({ first_payment_type, first_payment_amount, idempotencyKey, ...data }) => studentsAPI.register({
      ...data,
      course_price: data.course_price === '' ? null : data.course_price,
      booking_amount: first_payment_type === 'booking' ? (first_payment_amount || '0') : '0',
      amount: first_payment_type === 'payment' ? (first_payment_amount || '0') : '0',
    }, idempotencyKey),
    onSuccess: async () => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['groups']);
      // Перезагрузить студентов группы
      if (selectedGroup?.id) {
        // Сбросить кэш и перезагрузить
        setGroupStudents(prev => {
          const newState = { ...prev };
          delete newState[selectedGroup.id];
          return newState;
        });
        // Если группа раскрыта, перезагрузить студентов
        if (expandedGroups[selectedGroup.id]) {
          await loadGroupStudents(selectedGroup.id);
        }
      }
      setIsStudentModalOpen(false);
      setStudentFormData({ full_name: '', phone: '', first_payment_type: 'none', first_payment_amount: '0', course_price: '', assistant_name: '', contract_status: 'unknown', comment: '' });
      setStudentRegistrationKey(freshKey());
      setSelectedGroup(null);
    },
  });

  const makePaymentMutation = useMutation({
    mutationFn: ({ studentId, amount }) => studentsAPI.makePayment(studentId, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setIsPaymentModalOpen(false);
      setPaymentFormData({ amount: '' });
      setSelectedStudent(null);
      // Reload students for the group
      if (selectedStudent?.group_id) {
        loadGroupStudents(selectedStudent.group_id);
      }
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ studentId, status, previousStatus }) => {
      if (status === 'frozen') return studentsAPI.freeze(studentId);
      if (status === 'active' && previousStatus === 'frozen') return studentsAPI.resume(studentId);
      return studentsAPI.changeStatus(studentId, status);
    },
    onSuccess: (student) => {
      // PATCH response is canonical: replace the entity immediately rather
      // than waiting for a browser refresh or an unrelated refetch.
      setGroupStudents((previous) => Object.fromEntries(Object.entries(previous).map(([groupId, page]) => [groupId, {
        ...page,
        results: page.results?.map((item) => item.id === student.id ? student : item),
      }])));
      setSelectedStudent((previous) => previous?.id === student.id ? student : previous);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const transferStudentMutation = useMutation({
    mutationFn: ({ studentId, groupId }) => studentsAPI.transferGroup(studentId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['groups']);
      // Reload all expanded groups
      Object.keys(expandedGroups).forEach(groupId => {
        if (expandedGroups[groupId]) {
          loadGroupStudents(groupId);
        }
      });
      setIsTransferModalOpen(false);
      setSelectedStudent(null);
    },
  });

  const changeGroupStatusMutation = useMutation({
    mutationFn: ({ groupId, status }) => groupsAPI.changeStatus(groupId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
    },
  });

  const loadGroupStudents = async (groupId) => {
    setLoadingStudents(prev => ({ ...prev, [groupId]: true }));
    try {
      const data = await groupsAPI.getStudents(
        groupId,
        normalizedStudentNameSearch ? { search: normalizedStudentNameSearch } : undefined
      );
      setGroupStudents(prev => ({ ...prev, [groupId]: data }));
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoadingStudents(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const loadStudentTransactions = async (studentId) => {
    if (studentTransactions[studentId]) return; // Already loaded
    setLoadingTransactions(prev => ({ ...prev, [studentId]: true }));
    try {
      const data = await transactionsAPI.getList({ student: studentId });
      setStudentTransactions(prev => ({ ...prev, [studentId]: data }));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoadingTransactions(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const toggleGroup = async (groupId) => {
    const isExpanding = !expandedGroups[groupId];
    setExpandedGroups(prev => ({ ...prev, [groupId]: isExpanding }));
    if (isExpanding) {
      await loadGroupStudents(groupId);
    }
  };

  const toggleStudent = async (studentId) => {
    const isExpanding = !expandedStudents[studentId];
    setExpandedStudents(prev => ({ ...prev, [studentId]: isExpanding }));
    if (isExpanding && !studentTransactions[studentId]) {
      await loadStudentTransactions(studentId);
    }
  };

  const toggleStudentDetails = (student) => {
    setSelectedStudent((current) => current?.id === student.id ? null : student);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      frozen: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-violet-100 text-violet-800 border-violet-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const labels = {
      active: '✓ Активный',
      frozen: '❄ Тоңдурулган',
      completed: '✓ Завершил обучение',
      archived: '✕ Архивирован',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.active}`}>
        {labels[status] || labels.active}
      </span>
    );
  };

  const handleStatusChange = (studentId, newStatus, e) => {
    e.stopPropagation();
    const student = Object.values(groupStudents).flatMap((page) => page.results || []).find((item) => item.id === studentId);
    const previousStatus = student?.learning_status || student?.status || 'active';
    if (newStatus === 'frozen' && !window.confirm(`Окуучунун статусун өзгөртүүнү каалайсызбы?`)) return;
    if (newStatus !== previousStatus) {
      changeStatusMutation.mutate({ studentId, status: newStatus, previousStatus });
    }
  };

  const handleTransferStudent = (student, e) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setIsTransferModalOpen(true);
  };

  const getGroupStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const labels = {
      active: '🟢 Активдүү',
      completed: '✓ Аяктады',
      archived: '📦 Архивделген',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.active}`}>
        {labels[status] || labels.active}
      </span>
    );
  };

  const handleGroupStatusChange = (groupId, newStatus, e) => {
    e.stopPropagation();
    if (window.confirm(`Топтун статусун өзгөртүүнү каалайсызбы?`)) {
      changeGroupStatusMutation.mutate({ groupId, status: newStatus });
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Топтор</h1>
          <p className="mt-1 text-sm text-gray-500">Окуу топторун жана окуучуларды башкаруу</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={studentNameSearch}
              onChange={(e) => setStudentNameSearch(e.target.value)}
              placeholder="Окуучунун аты же телефону боюнча издөө"
              aria-label="Окуучунун аты же телефону боюнча издөө"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {studentNameSearch && (
              <button
                type="button"
                onClick={() => setStudentNameSearch('')}
                aria-label="Издөөнү тазалоо"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {/* Фильтр по статусу */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🟢 Активдүү
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                statusFilter === 'completed'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✓ Аяктады
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                statusFilter === 'archived'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Архив
            </button>
          </div>
          {user?.role === 'cashier' && (
            <button onClick={() => setIsGroupModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />Топ түзүү
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>
      ) : (
        <div className="space-y-4">
          {groups?.results?.map((group) => {
            const isExpanded = expandedGroups[group.id];
            const loadedStudents = groupStudents[group.id];
            const students = normalizedStudentNameSearch
              ? {
                  ...loadedStudents,
                  results: loadedStudents?.results?.filter((student) => {
                    const searchValue = normalizedStudentNameSearch.toLocaleLowerCase()
                    return student.full_name.toLocaleLowerCase().includes(searchValue)
                      || (student.phone || '').toLocaleLowerCase().includes(searchValue)
                  }),
                }
              : loadedStudents;
            const isLoadingStudents = loadingStudents[group.id];
            return (
              <div key={group.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100" onClick={() => toggleGroup(group.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <TechnologyIcon technology={group.technology || group.subject} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                          {getGroupStatusBadge(group.status || 'active')}
                        </div>
                        <p className="text-sm text-gray-500">{group.technology || group.subject} • {group.duration_months ? `${group.duration_months} мес.` : group.schedule} {group.study_days_per_week ? `• ${group.study_days_per_week} дн./нед.` : ''}</p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Окуучулар</p>
                          <p className="text-lg font-bold text-gray-900">{group.student_count || 0}</p>
                        </div>
                        {user?.role === 'cashier' && (
                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={group.status || 'active'}
                              onChange={(e) => handleGroupStatusChange(group.id, e.target.value, e)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="active">Активдүү</option>
                              <option value="completed">Аяктады</option>
                              <option value="archived">Архивделген</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {user?.role === 'cashier' && (
                        <button onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); setStudentRegistrationKey(freshKey()); setIsStudentModalOpen(true); }} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">+ Окуучу</button>
                      )}
                      {user?.role === 'cashier' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTechnologyEditor(group); }} className="px-3 py-1 text-sm text-blue-700 bg-blue-50 rounded hover:bg-blue-100">Технология</button>
                      )}
                      <div className="p-2 text-gray-400">{isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}</div>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-6 py-4 bg-white">
                    {isLoadingStudents ? (
                      <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-sm text-gray-500">Окуучулар жүктөлүүдө...</p></div>
                    ) : students?.results?.length > 0 ? (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="min-w-[1120px] w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Окуучу</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон / окуу</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Төлөм</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Баасы / төлөнгөн</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Бүгүн / мөөнөтү өткөн</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Калдык / кийинки</th>
                              {user?.role === 'cashier' && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Аракеттер</th>}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {students.results.map((student) => {
                              const isStudentExpanded = expandedStudents[student.id];
                              const transactions = studentTransactions[student.id];
                              const isLoadingTx = loadingTransactions[student.id];
                              
                              return (
                                <Fragment key={student.id}>
                                  <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleStudent(student.id)}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                          {isStudentExpanded ? (
                                            <ChevronUpIcon className="h-5 w-5 text-gray-400 mr-2" />
                                          ) : (
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400 mr-2" />
                                          )}
                                        </div>
                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                          <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4 text-sm font-medium text-gray-900">{student.full_name}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                      <div className="flex items-center space-x-2">
                                        {getStatusBadge(student.learning_status || student.status || 'active')}
                                        {user?.role === 'cashier' && (
                                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                            <select
                                              value={student.learning_status || student.status || 'active'}
                                              onChange={(e) => handleStatusChange(student.id, e.target.value, e)}
                                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                              <option value="active">Активный</option>
                                              <option value="frozen">Тоңдурулган</option>
                                              <option value="completed">Завершил обучение</option>
                                              <option value="archived">Архивирован</option>
                                            </select>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-1">{student.phone || '—'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className="text-sm font-semibold">{student.payment_status === 'unknown' ? 'График түзүлгөн эмес' : student.payment_status === 'overdue' ? '🔴 Мөөнөтү өткөн' : student.payment_status === 'upcoming' ? '🟡 Кийинки төлөм' : student.payment_status}</span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm"><div>{student.course_price === null || student.course_price === undefined || student.course_price === '' ? '—' : `${parseFloat(student.course_price).toLocaleString('ru-RU')} сом`}</div><b className="text-green-600">{parseFloat(student.amount_paid_total || 0).toLocaleString('ru-RU')} сом</b></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm"><div>{parseFloat(student.financial_summary?.due_now || 0).toLocaleString('ru-RU')} сом</div><b className="text-red-600">{parseFloat(student.financial_summary?.overdue_amount || 0).toLocaleString('ru-RU')} сом</b></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm"><div>{student.financial_summary?.contract_remaining == null ? '—' : `${parseFloat(student.financial_summary.contract_remaining).toLocaleString('ru-RU')} сом`}</div><span className="text-gray-500">{student.financial_summary?.next_payment_date || '—'}</span></td>
                                    {user?.role === 'cashier' && (
                                      <td className="px-4 py-4 text-right">
                                        <div className="flex min-w-[272px] flex-wrap justify-end gap-2">
                                          <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); setIsPaymentModalOpen(true); }} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                                            <BanknotesIcon className="h-4 w-4 mr-1" />Төлөм
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); toggleStudentDetails(student); }} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-50">Карточка</button>
                                          <button onClick={(e) => handleTransferStudent(student, e)} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200">
                                            🔄 Которуу
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                  {isStudentExpanded && (
                                    <tr>
                                      <td colSpan={user?.role === 'cashier' ? 7 : 6} className="px-4 py-4 bg-gray-50">
                                        {isLoadingTx ? (
                                          <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-2 text-xs text-gray-500">Транзакциялар жүктөлүүдө...</p>
                                          </div>
                                        ) : transactions?.results?.length > 0 ? (
                                          <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Транзакциялар тарыхы:</h4>
                                            <div className="space-y-2">
                                              {transactions.results.map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                                  <div className="flex items-center space-x-4">
                                                    <div className={`flex-shrink-0 w-2 h-2 rounded-full ${tx.type === 'register' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                                    <div>
                                                      <p className="text-sm font-medium text-gray-900">
                                                        {tx.type === 'register' ? '📝 Каттоо' : '💵 Төлөм'}
                                                      </p>
                                                      <p className="text-xs text-gray-500">
                                                        {new Date(tx.created_at).toLocaleString('ru-RU')}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">{parseFloat(tx.amount).toLocaleString('ru-RU')} сом</p>
                                                    <p className="text-xs text-gray-500">Кассир: {tx.cashier_name}</p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center py-4">
                                            <p className="text-sm text-gray-500">Транзакциялар жок</p>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                        <div className="mt-4 px-6 py-3 bg-gray-50 rounded-lg"><div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700">Жалпы сумма:</span><span className="text-xl font-bold text-green-600">{students.results.reduce((sum, s) => sum + parseFloat(s.amount_paid_total || 0), 0).toLocaleString('ru-RU')} сом</span></div></div>
                      </>
                    ) : (
                      <div className="text-center py-12"><AcademicCapIcon className="mx-auto h-12 w-12 text-gray-300" /><h3 className="mt-2 text-sm font-medium text-gray-900">Окуучулар жок</h3><p className="mt-1 text-sm text-gray-500">Бул топто али окуучулар каттал элек</p></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {groups?.results?.length === 0 && (
            <div className="rounded-lg bg-white py-12 text-center shadow">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-medium text-gray-900">Окуучулар табылган жок</h3>
              <p className="mt-1 text-sm text-gray-500">
                {normalizedStudentNameSearch ? 'Башка атты жазып көрүңүз' : 'Бул статуста топтор жок'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>

    {studentDetailsError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{studentDetailsError}</p>}
    {selectedStudent && !isPaymentModalOpen && !isTransferModalOpen && <StudentDetails student={selectedStudent} onClose={() => setSelectedStudent(null)} onChanged={(updated) => {
      if (!updated || typeof updated !== 'object' || !updated.id) {
        console.error('Student update callback received an invalid response:', updated)
        setStudentDetailsError('Карточка ученика не обновлена: CRM вернула неполные данные. Финансовые записи не изменены. Обновите страницу и обратитесь к администратору, если ошибка повторится.')
        return
      }
      setStudentDetailsError('')
      setSelectedStudent(updated)
      setGroupStudents((previous) => Object.fromEntries(Object.entries(previous).map(([groupId, page]) => [groupId, {
        ...page,
        results: page.results?.map((item) => item.id === updated.id ? updated : item),
      }])))
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (updated.group) loadGroupStudents(updated.group)
    }} />}

    {/* Модальное окно создания группы */}
    {isGroupModalOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setIsGroupModalOpen(false)}>
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-medium mb-4">Жаңы топ түзүү</h3>
          <form onSubmit={(e) => { e.preventDefault(); submitGroup(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Топтун аталышы</label>
                <input type="text" required value={groupFormData.name} onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Технология</label>
                <select value={groupFormData.technology} onChange={(e) => setGroupFormData({ ...groupFormData, technology: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  {TECHNOLOGIES.map((technology) => <option key={technology} value={technology}>{technology}</option>)}
                  <option value="other">Другое</option>
                </select>
              </div>
              {groupFormData.technology === 'other' && <div>
                <label className="block text-sm font-medium text-gray-700">Другое направление</label>
                <input type="text" required value={groupFormData.customTechnology} onChange={(e) => setGroupFormData({ ...groupFormData, customTechnology: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>}
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700">Расписание: дни недели</legend>
                <div className="mt-2 flex flex-wrap gap-2">{WEEKDAYS.map((day) => <label key={day.value} className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${groupFormData.scheduleDays.includes(day.value) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'}`}><input type="checkbox" className="sr-only" checked={groupFormData.scheduleDays.includes(day.value)} onChange={() => toggleScheduleDay(day.value)} />{day.label}</label>)}</div>
              </fieldset>
              <div>
                <label className="block text-sm font-medium text-gray-700">Время занятий</label>
                <input type="text" required placeholder="19:00–21:00" value={groupFormData.scheduleTime} onChange={(e) => setGroupFormData({ ...groupFormData, scheduleTime: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                <p className="mt-1 text-xs text-gray-500">Дни выбираются отдельно; API получает читаемую строку расписания.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-gray-700">Длительность, мес.<input type="number" required min="1" value={groupFormData.duration_months} onChange={(e) => setGroupTiming({ duration_months: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" /></label>
                <div className="block text-sm font-medium text-gray-700">Занятий в неделю<div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">{groupFormData.scheduleDays.length || '—'}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-gray-700">Начало<input type="date" required value={groupFormData.start_date} onChange={(e) => setGroupTiming({ start_date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" /></label>
                <label className="block text-sm font-medium text-gray-700">Окончание<input type="date" value={groupFormData.end_date} onChange={(e) => { setIsEndDateManual(true); setGroupFormData({ ...groupFormData, end_date: e.target.value }); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" /></label>
              </div>
              <label className="block text-sm font-medium text-gray-700">Всего занятий <span className="text-xs text-gray-500">(рассчитано; можно скорректировать)</span><input type="number" min="1" value={groupFormData.total_lessons || (groupFormData.scheduleDays.length && groupFormData.duration_months ? groupFormData.scheduleDays.length * Number(groupFormData.duration_months) * 4 : '')} onChange={(e) => setGroupFormData({ ...groupFormData, total_lessons: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" /></label>
              {groupFormError && <p role="alert" className="text-sm text-red-700">{groupFormError}</p>}
              {createGroupMutation.isError && <p role="alert" className="text-sm text-red-700">{createGroupMutation.error?.response?.data?.detail || 'Не удалось создать группу.'}</p>}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Жокко чыгаруу</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Түзүү</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Модальное окно регистрации студента */}
    {isStudentModalOpen && selectedGroup && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setIsStudentModalOpen(false)}>
        <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-lg bg-white" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-5 text-gray-900">Окуучуну каттоо: {selectedGroup.name}</h3>
          <form onSubmit={(e) => { e.preventDefault(); registerStudentMutation.mutate({ ...studentFormData, group: selectedGroup.id, idempotencyKey: studentRegistrationKey }); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Окуучунун толук аты</label>
                <input 
                  type="text" 
                  required 
                  value={studentFormData.full_name} 
                  onChange={(e) => setStudentFormData({ ...studentFormData, full_name: e.target.value })} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                  placeholder="Асан Усонов"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон <span className="text-xs text-gray-500">(необязательно)</span></label>
                <input type="tel" value={studentFormData.phone} onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="+996700000000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Алгачкы акча</label>
                <select value={studentFormData.first_payment_type} onChange={(e) => setStudentFormData({ ...studentFormData, first_payment_type: e.target.value, first_payment_amount: e.target.value === 'none' ? '0' : studentFormData.first_payment_amount })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="none">Төлөмсүз каттоо</option>
                  <option value="booking">Бронь</option>
                  <option value="payment">Биринчи төлөм</option>
                </select>
                {studentFormData.first_payment_type !== 'none' && <input type="number" min="0" step="0.01" required value={studentFormData.first_payment_amount} onChange={(e) => setStudentFormData({ ...studentFormData, first_payment_amount: e.target.value })} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg font-medium" placeholder="0" />}
                <p className="mt-1 text-xs text-gray-500">Бронь жалпы төлөмгө кирет жана келишимдин калдыгын азайтат.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость курса <span className="text-xs text-gray-500">(необязательно)</span></label>
                <input type="number" min="0" step="0.01" value={studentFormData.course_price} onChange={(e) => setStudentFormData({ ...studentFormData, course_price: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ассистент <span className="text-xs text-gray-500">(необязательно)</span></label>
                <input type="text" value={studentFormData.assistant_name} onChange={(e) => setStudentFormData({ ...studentFormData, assistant_name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус договора</label>
                <select value={studentFormData.contract_status} onChange={(e) => setStudentFormData({ ...studentFormData, contract_status: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"><option value="unknown">Не указан</option><option value="signed">Подписан</option><option value="not_signed">Не подписан</option></select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий <span className="text-xs text-gray-500">(необязательно)</span></label>
                <textarea value={studentFormData.comment} onChange={(e) => setStudentFormData({ ...studentFormData, comment: e.target.value })} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              {registerStudentMutation.isError && <p role="alert" className="text-sm text-red-700">{registerStudentMutation.error?.response?.data?.detail || 'Не удалось зарегистрировать ученика.'}</p>}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => { setIsStudentModalOpen(false); setSelectedGroup(null); }} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Жокко чыгаруу
              </button>
              <button 
                type="submit" 
                disabled={registerStudentMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {registerStudentMutation.isLoading ? 'Каттоо...' : 'Каттоо'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {technologyEditor && (
      <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50" onClick={() => setTechnologyEditor(null)}>
        <div className="relative top-20 mx-auto w-96 rounded-lg border bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-gray-900">Технология группы</h3>
          <p className="mt-1 text-sm text-gray-500">{technologyEditor.name}. Изменение не затрагивает учеников, платежи или историю.</p>
          <label className="mt-4 block text-sm font-medium text-gray-700">Направление
            <select defaultValue={technologyEditor.technology || technologyEditor.subject || ''} onChange={(e) => setTechnologyEditor({ ...technologyEditor, nextTechnology: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">Не указано</option>{TECHNOLOGIES.map((technology) => <option key={technology} value={technology}>{technology}</option>)}
            </select>
          </label>
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setTechnologyEditor(null)} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Отмена</button><button type="button" disabled={updateTechnologyMutation.isPending} onClick={() => updateTechnologyMutation.mutate({ id: technologyEditor.id, technology: technologyEditor.nextTechnology ?? technologyEditor.technology ?? technologyEditor.subject ?? '' })} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">Сохранить</button></div>
          {updateTechnologyMutation.isError && <p role="alert" className="mt-3 text-sm text-red-700">Не удалось сохранить технологию.</p>}
        </div>
      </div>
    )}

    {/* Модальное окно оплаты */}
    {isPaymentModalOpen && selectedStudent && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setIsPaymentModalOpen(false)}>
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-medium mb-4">Төлөм кабыл алуу: {selectedStudent.full_name}</h3>
          <form onSubmit={(e) => { e.preventDefault(); makePaymentMutation.mutate({ studentId: selectedStudent.id, amount: paymentFormData.amount }); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Төлөм суммасы (сом)</label>
                <input type="number" required min="0" step="0.01" value={paymentFormData.amount} onChange={(e) => setPaymentFormData({ amount: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Учурдагы баланс:</p>
                <p className="text-xl font-bold text-green-600">{parseFloat(selectedStudent.amount_paid_total || 0).toLocaleString('ru-RU')} сом</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Жокко чыгаруу</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Төлөм кабыл алуу</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Модальное окно перевода студента */}
    {isTransferModalOpen && selectedStudent && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setIsTransferModalOpen(false)}>
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-medium mb-4">Окуучуну которуу: {selectedStudent.full_name}</h3>
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const formData = new FormData(e.target);
            const groupId = formData.get('group_id');
            if (groupId && groupId !== selectedStudent.group) {
              transferStudentMutation.mutate({ studentId: selectedStudent.id, groupId });
            }
          }}>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Учурдагы топ:</p>
                <p className="text-base font-bold text-blue-900">{selectedStudent.group_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Жаңы топ:</label>
                <select 
                  name="group_id"
                  required 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Топту тандаңыз</option>
                  {groups?.results?.filter(g => g.id !== selectedStudent.group).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Жокко чыгаруу</button>
              <button type="submit" disabled={transferStudentMutation.isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                {transferStudentMutation.isLoading ? 'Которуу...' : 'Которуу'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
};

export default Groups;
