'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'vi';
type Theme = 'light' | 'dark';
type UserPlan = 'free' | 'pro' | 'enterprise';

interface UserSettings {
  language: Language;
  theme: Theme;
  plan: UserPlan;
}

interface UserSettingsContextType {
  settings: UserSettings;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setPlan: (plan: UserPlan) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Try to get saved settings from localStorage
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    }
    // Default settings
    return {
      language: 'vi',
      theme: 'light',
      plan: 'free'
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Apply theme to document
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply language to document
    document.documentElement.lang = settings.language;
  }, [settings]);

  const setLanguage = (language: Language) => {
    setSettings(prev => ({ ...prev, language }));
  };

  const setTheme = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const setPlan = (plan: UserPlan) => {
    setSettings(prev => ({ ...prev, plan }));
  };

  return (
    <UserSettingsContext.Provider value={{ settings, setLanguage, setTheme, setPlan }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}