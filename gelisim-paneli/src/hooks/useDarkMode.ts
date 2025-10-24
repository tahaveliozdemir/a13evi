import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch (err) {
      console.warn('Failed to read dark mode preference from localStorage:', err);
      return false; // Default to light mode if localStorage fails
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
      localStorage.setItem('darkMode', JSON.stringify(isDark));
    } catch (err) {
      console.warn('Failed to save dark mode preference to localStorage:', err);
      // Continue without saving - the theme will still work for this session
    }
  }, [isDark]);

  const toggle = () => setIsDark(!isDark);

  return { isDark, toggle };
}
