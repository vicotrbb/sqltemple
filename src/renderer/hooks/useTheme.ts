import { useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';

const themes = {
  dark: {
    '--vscode-bg': '#1e1e1e',
    '--vscode-bg-secondary': '#252526',
    '--vscode-bg-tertiary': '#2d2d30',
    '--vscode-bg-quaternary': '#383838',
    '--vscode-text': '#cccccc',
    '--vscode-text-secondary': '#858585',
    '--vscode-text-tertiary': '#6e6e6e',
    '--vscode-border': '#454545',
    '--vscode-blue': '#007ACC',
    '--vscode-blue-light': '#1177BB',
    '--vscode-green': '#4ec9b0',
    '--vscode-error': '#f44747',
    '--vscode-warning': '#ffcc02',
  },
  light: {
    '--vscode-bg': '#ffffff',
    '--vscode-bg-secondary': '#f3f3f3',
    '--vscode-bg-tertiary': '#eaeaea',
    '--vscode-bg-quaternary': '#e0e0e0',
    '--vscode-text': '#333333',
    '--vscode-text-secondary': '#666666',
    '--vscode-text-tertiary': '#999999',
    '--vscode-border': '#d0d0d0',
    '--vscode-blue': '#007ACC',
    '--vscode-blue-light': '#1177BB',
    '--vscode-green': '#4ec9b0',
    '--vscode-error': '#d32f2f',
    '--vscode-warning': '#f57c00',
  },
};

const fontFamilies = {
  monaco: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
  consolas: '"Consolas", "Monaco", "Lucida Console", monospace',
  courier: '"Courier New", "Courier", monospace',
  'fira-code': '"Fira Code", "Monaco", "Menlo", monospace',
};

export const useTheme = () => {
  const { config } = useConfig();

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const { theme, fontSize, fontFamily, uiScale } = config.appearance;

      let actualTheme = theme;
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        actualTheme = prefersDark ? 'dark' : 'light';
      }

      const themeColors = themes[actualTheme as keyof typeof themes];
      Object.entries(themeColors).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });

      root.style.setProperty('--editor-font-size', `${fontSize}px`);
      root.style.setProperty('--editor-font-family', fontFamilies[fontFamily]);
      
      root.style.setProperty('--ui-scale', uiScale.toString());
      
      document.body.style.transform = `scale(${uiScale})`;
      document.body.style.transformOrigin = 'top left';
      
      const scaledWidth = Math.ceil(100 / uiScale);
      const scaledHeight = Math.ceil(100 / uiScale);
      document.body.style.width = `${scaledWidth}%`;
      document.body.style.height = `${scaledHeight}%`;

      document.body.className = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('theme-'))
        .concat(`theme-${actualTheme}`)
        .join(' ');
    };

    applyTheme();

    if (config.appearance.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [config.appearance]);

  return {
    currentTheme: config.appearance.theme,
    isDark: config.appearance.theme === 'dark' || 
           (config.appearance.theme === 'system' && 
            window.matchMedia('(prefers-color-scheme: dark)').matches),
    fontSize: config.appearance.fontSize,
    fontFamily: config.appearance.fontFamily,
    uiScale: config.appearance.uiScale,
  };
};