import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import { ArrowRightOnRectangleIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuthStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: notifications } = useQuery({ queryKey: ['payment-notifications'], queryFn: () => notificationsAPI.getList({ unread: 'true' }), enabled: Boolean(user) });
  const readMutation = useMutation({ mutationFn: notificationsAPI.markRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-notifications'] }) });

  const handleLogout = () => {
    logout();
  };

  const getRoleLabel = (role) => {
    const roles = {
      cashier: 'Кассир',
      accountant: 'Бухгалтер',
      director: 'Директор',
    };
    return roles[role] || role;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#158348] font-black text-white md:hidden">i</div>
          <div>
          <h2 className="text-base font-extrabold text-[#123c28] sm:text-lg">ITadis башкаруу тутуму</h2>
          <p className="hidden text-xs text-slate-500 sm:block">Финансылык эсеп жана окуу процесси</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-[#e7f5ec] px-3 py-1.5 text-xs font-semibold text-[#287a4a] lg:flex"><ShieldCheckIcon className="h-4 w-4"/> Коопсуз сессия</span>
          <div className="relative">
          <button onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Билдирмелер">
            <BellIcon className="h-5 w-5" />
            {notifications?.unread_count > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{notifications.unread_count}</span>}
          </button>
          {notificationsOpen && <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><p className="mb-2 font-bold text-slate-800">Уведомления</p>{notifications?.results?.length ? notifications.results.map((item) => <button key={item.id} onClick={() => { readMutation.mutate(item.id); setNotificationsOpen(false); navigate(`/cashier?student=${item.student_id}`) }} className="mb-2 w-full rounded-lg bg-slate-50 p-3 text-left text-sm hover:bg-slate-100"><b>{item.kind === 'overdue' ? 'Просрочен платёж' : 'Скоро оплата'}</b><br />{item.student_name} — {item.amount} сом · {item.group_name}<br /><span className="text-slate-500">Срок: {item.due_date}</span></button>) : <p className="text-sm text-slate-500">Новых уведомлений нет</p>}</div>}
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:gap-3 sm:pl-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.full_name || user?.username}</p>
              <p className="text-xs text-slate-500">{getRoleLabel(user?.role)}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-[#c1443a] transition-colors"
              title="Чыгуу"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
