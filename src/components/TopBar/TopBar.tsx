'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ModelType } from '../../types/types';

interface TopBarProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  rerunLastQuery?: () => void;
  lastQuery?: string;
}

type ModelGroup = {
  logo: JSX.Element;
  models: { [key: string]: string };
};

type ModelGroups = {
  [key: string]: ModelGroup;
};

const modelGroups: ModelGroups = {
  'DeepSeek': {
    logo: <svg viewBox="0 0 1024 1024" className="w-5 h-5 text-gray-700"><path d="M916.692 908.591c59.701-59.701..." fill="currentColor"/></svg>,
    models: {
      'deepseek-reasoner': 'Reasoner - Optimized for analysis',
      'deepseek-chat': 'Chat - Best for general tasks',
      'deepseek-coder': 'Coder - Specialized for programming'
    }
  },
  'OpenAI': {
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700"><path d="M22.2819 9.8211a5.9847..." fill="currentColor"/></svg>,
    models: {
      'gpt-4-turbo': 'GPT-4 Turbo - Latest version',
      'gpt-4': 'GPT-4 - Stable version',
      'gpt-4o': 'GPT-4o - Quality optimized',
      'gpt-4o-mini': 'GPT-4o Mini - Speed optimized',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo - Fast and efficient'
    }
  },
  'Anthropic': {
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700"><path d="M15.4 0a8.6..." fill="currentColor"/></svg>,
    models: {
      'claude-3-opus': 'Claude 3 Opus - Most powerful',
      'claude-3-sonnet': 'Claude 3 Sonnet - Balanced performance',
      'claude-2': 'Claude 2 - Stable version'
    }
  },
  'Google': {
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700"><path d="M12 2C6.48..." fill="currentColor"/></svg>,
    models: {
      'gemini-pro': 'Gemini Pro - Latest version',
      'gemini-pro-vision': 'Gemini Pro Vision - Multimodal'
    }
  },
  'Meta': {
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700"><path d="M12 2C6.48..." fill="currentColor"/></svg>,
    models: {
      'llama-2-70b': 'Llama 2 70B - Largest model',
      'llama-2-13b': 'Llama 2 13B - Balanced size',
      'llama-2-7b': 'Llama 2 7B - Compact version'
    }
  },
  'Mistral': {
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700"><path d="M12 2C6.48..." fill="currentColor"/></svg>,
    models: {
      'mistral-large': 'Mistral Large - Most capable',
      'mistral-medium': 'Mistral Medium - Balanced model',
      'mistral-small': 'Mistral Small - Fast inference'
    }
  }
};

export const TopBar = ({ selectedModel, setSelectedModel, rerunLastQuery, lastQuery }: TopBarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const { data: session } = useSession();

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

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50 shadow-sm">
      <div className="flex items-center">
        <div className="relative">
          <button
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-left flex items-center gap-2 group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedModelInfo.icon}
            <span className="font-medium text-sm">{selectedModelInfo.name}</span>
            <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-2 flex z-50">
              <div className="w-[200px] border-r border-gray-100">
                {Object.entries(modelGroups).map(([groupName, group]) => (
                  <div
                    key={groupName}
                    className={`px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer ${hoveredGroup === groupName ? 'bg-gray-50' : ''}`}
                    onMouseEnter={() => setHoveredGroup(groupName)}
                  >
                    {group.logo}
                    <span className="text-sm font-medium">{groupName}</span>
                  </div>
                ))}
              </div>
              <div className="w-[300px]">
                {hoveredGroup && Object.entries(modelGroups[hoveredGroup].models).map(([modelId, modelName]) => (
                  <div
                    key={modelId}
                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${selectedModel === modelId ? 'bg-gray-100' : ''}`}
                    onClick={() => handleModelSelect(modelId)}
                  >
                    <div className="text-sm font-medium">{modelName.split(' - ')[0]}</div>
                    <div className="text-xs text-gray-500">{modelName.split(' - ')[1]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <h1 className="text-xl font-serif tracking-tight text-gray-900 flex items-center gap-2">
          FGTC Search <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 font-sans">Beta</span>
        </h1>

        {session?.user ? (
          <>
            <div className="flex items-center gap-2">
              <img src={session.user.image || '/default-avatar.png'} alt="Avatar" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-sm text-red-500 hover:text-red-600 font-medium hover:underline"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn('google', {
              callbackUrl: window.location.origin,
              redirect: true,
            })}
            className="flex items-center gap-2 text-sm bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign Up with Google
          </button>
        )}
      </div>
    </header>
  );
};
