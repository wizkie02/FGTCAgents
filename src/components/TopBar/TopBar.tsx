'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ModelType } from '../../types/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserSettings } from '@/lib/contexts/UserSettingsContext';
import { getTranslation } from '@/lib/translations';

interface TopBarProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  rerunLastQuery?: () => void;
  lastQuery?: string;
}

type Language = 'en' | 'vi';
type Theme = 'light' | 'dark';

type UserPlan = 'free' | 'pro' | 'enterprise';

interface UserSettings {
  language: Language;
  theme: Theme;
  plan: UserPlan;
}

type ModelGroup = {
  logo: JSX.Element;
  models: { [key: string]: string };
};

type ModelGroups = {
  [key: string]: ModelGroup;
};

const modelGroups: ModelGroups = {
  'OpenAI': {
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.0244 1.1686a.071.071 0 0 1 .038.0615v5.6094a4.504 4.504 0 0 1-4.4989 4.4581zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0244 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7867A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1282 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4069-.6765zm2.0623-3.0374-.142-.0852-4.7782-2.7818a.7712.7712 0 0 0-.7806 0L9.409 9.2047V6.8723a.0804.0804 0 0 1 .0332-.0615l4.8303-2.7867a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.0244-1.1638a.0757.0757 0 0 1-.038-.0615V6.0252a4.4992 4.4992 0 0 1 7.3757-3.4366l-.142.0805L8.704 5.4223a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="currentColor" />
    </svg>,
    models: {
      'gpt-4-turbo': 'gpt-4 Turbo - Phiên bản mới nhất, mạnh mẽ nhất',
      'gpt-4o': 'gpt-4o - Phiên bản tối ưu',
      'gpt-4o-mini': 'gpt-4o Mini - Phiên bản nhỏ gọn của gpt-4o',
      'gpt-3.5-turbo-0125': 'gpt-3.5 Turbo - Phiên bản cập nhật mới nhất',
      'gpt-3.5-turbo-instruct': 'gpt-3.5 Instruct - Tối ưu cho hướng dẫn',
      'o1': 'o1 - Model thế hệ mới',
      'o1-mini': 'o1 mini - Phiên bản nhỏ gọn',
      'o1-pro': 'o1 Pro - Phiên bản chuyên nghiệp',
      'o3-mini': 'o3 Mini - Model nhỏ gọn',
    }
  },
  'Anthropic': {
    logo: <svg fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>,
    models: {
      'claude-3-opus': 'Claude 3 Opus - Mô hình mạnh mẽ nhất',
      'claude-3.7-sonnet': 'Claude 3.7 Sonnet - Phiên bản mới nhất',
      'claude-3.5-sonnet-new': 'Claude 3.5 Sonnet New - Cập nhật mới',
      'claude-3.5-haiku': 'Claude 3.5 Haiku - Tối ưu tốc độ',
      'claude-3-sonnet': 'Claude 3 Sonnet - Cân bằng hiệu suất',
      'claude-3-haiku': 'Claude 3 Haiku - Phản hồi nhanh',
      'claude-2.1': 'Claude 2.1 - Phiên bản ổn định'
    }
  },
  'Google': {
    logo: <svg fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
      <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" />
    </svg>,
    models: {
      'gemini-2.0-flash-exp': 'Gemini 2.0 Flash (Image) - Thử nghiệm',
      'gemini-2.0-flash': 'Gemini 2.0 Flash - Tốc độ cao',
      'gemini-1.5-pro': 'Gemini 1.5 Pro - Phiên bản Pro mới',
      'gemini-pro': 'Gemini Pro - Đa năng',
      'gemini-pro-vision': 'Gemini Pro Vision - Xử lý hình ảnh'
    }
  },
  'DeepSeek': {
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" fill="currentColor" />
    </svg>,
    models: {
      'deepseek-v3': 'DeepSeek V3 - Phiên bản mới nhất',
      'deepseek-r1': 'DeepSeek R1 - Nghiên cứu',
      'deepseek-coder-33b': 'Coder 33B - Lập trình cao cấp',
      'deepseek-coder-6.7b': 'Coder 6.7B - Lập trình hiệu quả',
      'deepseek-llm-67b-chat': 'Chat 67B - Trò chuyện thông minh',
      'deepseek-llm-7b-chat': 'Chat 7B - Trò chuyện nhanh'
    }
  },
  'Meta': {
    logo: <svg fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
      <path d="M6.897 4c1.915 0 3.516.932 5.43 3.376l.282-.373c.19-.246.383-.484.58-.71l.313-.35C14.588 4.788 15.792 4 17.225 4c1.273 0 2.469.557 3.491 1.516l.218.213c1.73 1.765 2.917 4.71 3.053 8.026l.011.392.002.25c0 1.501-.28 2.759-.818 3.7l-.14.23-.108.153c-.301.42-.664.758-1.086 1.009l-.265.142-.087.04a3.493 3.493 0 01-.302.118 4.117 4.117 0 01-1.33.208c-.524 0-.996-.067-1.438-.215-.614-.204-1.163-.56-1.726-1.116l-.227-.235c-.753-.812-1.534-1.976-2.493-3.586l-1.43-2.41-.544-.895-1.766 3.13-.343.592C7.597 19.156 6.227 20 4.356 20c-1.21 0-2.205-.42-2.936-1.182l-.168-.184c-.484-.573-.837-1.311-1.043-2.189l-.067-.32a8.69 8.69 0 01-.136-1.288L0 14.468c.002-.745.06-1.49.174-2.23l.1-.573c.298-1.53.828-2.958 1.536-4.157l.209-.34c1.177-1.83 2.789-3.053 4.615-3.16L6.897 4zm-.033 2.615l-.201.01c-.83.083-1.606.673-2.252 1.577l-.138.199-.01.018c-.67 1.017-1.185 2.378-1.456 3.845l-.004.022a12.591 12.591 0 00-.207 2.254l.002.188c.004.18.017.36.04.54l.043.291c.092.503.257.908.486 1.208l.117.137c.303.323.698.492 1.17.492 1.1 0 1.796-.676 3.696-3.641l2.175-3.4.454-.701-.139-.198C9.11 7.3 8.084 6.616 6.864 6.616zm10.196-.552l-.176.007c-.635.048-1.223.359-1.82.933l-.196.198c-.439.462-.887 1.064-1.367 1.807l.266.398c.18.274.362.56.55.858l.293.475 1.396 2.335.695 1.114c.583.926 1.03 1.6 1.408 2.082l.213.262c.282.326.529.54.777.673l.102.05c.227.1.457.138.718.138.176.002.35-.023.518-.073.338-.104.61-.32.813-.637l.095-.163.077-.162c.194-.459.29-1.06.29-1.785l-.006-.449c-.08-2.871-.938-5.372-2.2-6.798l-.176-.189c-.67-.683-1.444-1.074-2.27-1.074z" />
    </svg>,
    models: {
      'llama-3-70b': 'Llama 3 70B - Mô hình lớn nhất',
      'llama-3-8b': 'Llama 3 8B - Mô hình nhỏ gọn',
      'llama-2-70b': 'Llama 2 70B - Phiên bản ổn định',
      'llama-2-13b': 'Llama 2 13B - Cân bằng',
      'llama-2-7b': 'Llama 2 7B - Hiệu quả'
    }
  },
  'Mistral': {
    logo: <svg fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
      <path clip-rule="evenodd" d="M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z" />
    </svg>,
    models: {
      'mixtral-8x7b': 'Mixtral 8x7B - MoE hiệu suất cao',
      'mistral-7b': 'Mistral 7B - Nhỏ gọn, mạnh mẽ',
      'mistral-large': 'Mistral Large - Mô hình lớn',
      'mistral-medium': 'Mistral Medium - Cân bằng',
      'mistral-small': 'Mistral Small - Tối ưu tốc độ'
    }
  }
};

export const TopBar = ({ selectedModel, setSelectedModel, rerunLastQuery, lastQuery }: TopBarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings, setLanguage, setTheme } = useUserSettings();
  const { data: session, status } = useSession();
  const router = useRouter();

  const t = (key: string) => getTranslation(key, settings.language);

  const getSelectedModelDisplay = () => {
    for (const [groupName, group] of Object.entries(modelGroups)) {
      for (const [modelId, modelName] of Object.entries(group.models)) {
        if (modelId === selectedModel) {
          return {
            group: groupName,
            icon: group.logo,
            name: modelName.split(' - ')[0]
          };
        }
      }
    }
    return { group: 'Unknown', icon: '❓', name: selectedModel };
  };

  const selectedModelInfo = getSelectedModelDisplay();

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setIsDropdownOpen(false);
    if (lastQuery && rerunLastQuery) rerunLastQuery();
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-50 shadow-sm">
      <div className="flex items-center">
        <div className="relative">
          <button
            className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-left flex items-center gap-2 group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedModelInfo.icon}
            <span className="font-medium text-sm dark:text-white">{selectedModelInfo.name}</span>
            <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 py-2 flex z-50">
              <div className="w-[200px] border-r border-gray-100 dark:border-gray-700">
                {Object.entries(modelGroups).map(([groupName, group]) => (
                  <div
                    key={groupName}
                    className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer ${hoveredGroup === groupName ? 'bg-gray-50 dark:bg-gray-700' : ''
                      }`}
                    onMouseEnter={() => setHoveredGroup(groupName)}
                  >
                    {group.logo}
                    <span className="text-sm font-medium dark:text-white">{groupName}</span>
                  </div>
                ))}
              </div>
              <div className="w-[300px]">
                {hoveredGroup && Object.entries(modelGroups[hoveredGroup].models).map(([modelId, modelName]) => (
                  <div
                    key={modelId}
                    className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${selectedModel === modelId ? 'bg-gray-100 dark:bg-gray-600' : ''
                      }`}
                    onClick={() => handleModelSelect(modelId)}
                  >
                    <div className="text-sm font-medium dark:text-white">{modelName.split(' - ')[0]}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{modelName.split(' - ')[1]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <h1 className="text-xl font-serif tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          FGTC Search <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-sans">{t('common.beta')}</span>
        </h1>

        {status === 'authenticated' && session?.user ? (
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {session.user.name?.[0] || session.user.email?.[0] || '?'}
                </div>
              )}
              <div className="text-sm text-left">
                <p className="font-medium text-gray-700 dark:text-white">{session.user.name || session.user.email}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">{settings.plan} Plan</p>
              </div>
              <svg className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.settings')}</p>
                </div>

                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.language')}</span>
                    <button
                      onClick={() => setLanguage(settings.language === 'en' ? 'vi' : 'en')}
                      className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      {settings.language === 'en' ? 'English' : 'Tiếng Việt'}
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.theme')}</span>
                    <button
                      onClick={() => setTheme(settings.theme === 'light' ? 'dark' : 'light')}
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700"
                    >
                      <span className={`${settings.theme === 'dark' ? 'translate-x-6 bg-indigo-600' : 'translate-x-1 bg-white'} inline-block h-4 w-4 transform rounded-full transition`} />
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.currentPlan')}</span>
                    <span className="px-3 py-1 text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full capitalize">
                      {settings.plan}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('auth.signOut')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:ring-offset-gray-900"
            >
              {t('auth.signUp')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
