import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export type Theme = 'light' | 'dark';
export type Language = 'tr' | 'en';

interface AppContextType {
  // Theme
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Audio
  isPlaying: boolean;
  currentStation: any;
  setIsPlaying: (playing: boolean) => void;
  setCurrentStation: (station: any) => void;
  
  // Theme Colors
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    gradient: string[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('tr');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      
      if (savedTheme) {
        setTheme(savedTheme as Theme);
      }
      
      if (savedLanguage) {
        setLanguageState(savedLanguage as Language);
        i18n.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Theme colors
  const colors = {
    light: {
      primary: '#3B82F6',
      secondary: '#6366F1',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      gradient: ['#667eea', '#764ba2'],
    },
    dark: {
      primary: '#60A5FA',
      secondary: '#818CF8',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      border: '#334155',
      gradient: ['#667eea', '#764ba2'],
    },
  };

  const contextValue: AppContextType = {
    // Theme
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    
    // Language
    language,
    setLanguage,
    
    // UI State
    isLoading,
    setIsLoading,
    
    // Audio
    isPlaying,
    currentStation,
    setIsPlaying,
    setCurrentStation,
    
    // Colors
    colors: colors[theme],
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export { useApp as useAppContext };
export default AppContext;
