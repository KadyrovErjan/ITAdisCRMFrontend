import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Brand from './Brand';
import {
  HomeIcon,
  UserGroupIcon,
  CalculatorIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const navigation = [
    { name: 'Башкы бет', href: '/dashboard', icon: HomeIcon, roles: ['cashier', 'accountant', 'director'] },
    { name: 'Касса', href: '/cashier', icon: CalculatorIcon, roles: ['cashier'] },
    { name: 'Топтор', href: '/groups', icon: UserGroupIcon, roles: ['cashier', 'accountant', 'director'] },
    { name: 'Балансдар', href: '/balances', icon: ScaleIcon, roles: ['accountant', 'director'] },
    { name: 'Акча чогултуу', href: '/collections', icon: CurrencyDollarIcon, roles: ['accountant', 'director'] },
    { name: 'Чыгымдар', href: '/expenses', icon: ReceiptPercentIcon, roles: ['accountant', 'director'] },
    { name: 'Аналитика', href: '/analytics', icon: ChartBarIcon, roles: ['director'] },
    { name: 'Кызматкерлер', href: '/users', icon: UsersIcon, roles: ['director'] },
    { name: 'Профиль', href: '/profile', icon: UserCircleIcon, roles: ['cashier', 'accountant', 'director'] },
  ];

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="hidden md:flex flex-col sticky top-0 h-screen w-[268px] bg-white text-[#173c2b] border-r border-[#e1ebe4]">
      <div className="flex items-center px-6 h-20 border-b border-[#e8f0ea]">
        <Brand />
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors
                ${isActive
                  ? 'bg-[#eaf8ef] text-[#147d45] shadow-sm'
                  : 'text-slate-500 hover:bg-[#f1faf4] hover:text-[#147d45]'
                }
              `}
            >
              <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl border border-[#d7ecdf] bg-[#f2fbf5] p-4">
        <div className="flex items-center gap-2 text-xs text-[#16844d]"><ShieldCheckIcon className="h-4 w-4"/> Коопсуз сессия</div>
        <p className="mt-3 text-sm font-semibold text-[#173c2b]">{user?.full_name || user?.username}</p>
        <p className="mt-1 text-xs text-slate-500 capitalize">
          {user?.role === 'cashier' ? 'Кассир' :
                  user?.role === 'accountant' ? 'Бухгалтер' :
                  user?.role === 'director' ? 'Директор' : user?.role}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
