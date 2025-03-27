type Translations = {
  [key: string]: {
    en: string;
    vi: string;
  };
};

export const translations: Translations = {
  'dashboard.settings': {
    en: 'Dashboard Settings',
    vi: 'Cài đặt Trang chủ'
  },
  'settings.language': {
    en: 'Language',
    vi: 'Ngôn ngữ'
  },
  'settings.theme': {
    en: 'Theme',
    vi: 'Giao diện'
  },
  'settings.currentPlan': {
    en: 'Current Plan',
    vi: 'Gói hiện tại'
  },
  'auth.signIn': {
    en: 'Sign In',
    vi: 'Đăng nhập'
  },
  'auth.signUp': {
    en: 'Sign Up',
    vi: 'Đăng ký'
  },
  'auth.signOut': {
    en: 'Sign Out',
    vi: 'Đăng xuất'
  },
  'common.beta': {
    en: 'Beta',
    vi: 'Thử nghiệm'
  }
};

export function getTranslation(key: string, language: 'en' | 'vi'): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  return translation[language];
}