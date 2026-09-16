import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, hasRole, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    hasRole,
    logout,
    isAdmin: user?.role === 'admin',
    isDirector: user?.role === 'director',
    isAccountant: user?.role === 'accountant',
    isCashier: user?.role === 'cashier',
  };
};
