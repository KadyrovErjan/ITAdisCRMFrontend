import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Store для управления темой
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // 'light' или 'dark'
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'itadis-theme',
    }
  )
);

// Хук для использования темы
export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Удаляем предыдущую тему
    root.classList.remove('light', 'dark');
    
    // Добавляем новую тему
    root.classList.add(theme);
    
    // Устанавливаем data-атрибут для дополнительной стилизации
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
};

export default useTheme;
