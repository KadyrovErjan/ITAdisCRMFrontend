import { useAuthStore } from '../store/authStore';
import { ArrowRightOnRectangleIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuthStore();

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
          <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Билдирмелер">
            <BellIcon className="h-5 w-5" />
          </button>
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
