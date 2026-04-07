'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem('northstar-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => {
        const updatedTheme = nextTheme;
        setTheme(updatedTheme);
        document.documentElement.dataset.theme = updatedTheme;
        window.localStorage.setItem('northstar-theme', updatedTheme);
      }}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      <span aria-hidden="true">{theme === 'light' ? '◐' : '◑'}</span>
    </button>
  );
}
