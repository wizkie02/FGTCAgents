'use client';
import { useState } from 'react';
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
    logo: (
      <svg viewBox="0 0 1024 1024" className="w-5 h-5 text-gray-700">
        <path d="M916.692 908.591c59.701-59.701 106.515-129.282 139.052-206.705 33.576-79.975 50.615-164.898 50.615-252.308 0-87.41-17.039-172.333-50.615-252.308-32.537-77.423-79.35-147.004-139.052-206.705-59.701-59.701-129.282-106.515-206.705-139.052C630.013 17.937 545.09.898 457.68.898c-87.41 0-172.333 17.039-252.308 50.615-77.423 32.537-147.004 79.35-206.705 139.052-59.701 59.701-106.515 129.282-139.052 206.705C-173.961 477.245-191 562.168-191 649.578c0 87.41 17.039 172.333 50.615 252.308 32.537 77.423 79.35 147.004 139.052 206.705 59.701 59.701 129.282 106.515 206.705 139.052 79.975 33.576 164.898 50.615 252.308 50.615 87.41 0 172.333-17.039 252.308-50.615 77.423-32.537 147.004-79.35 206.705-139.052z" fill="currentColor"/>
      </svg>
    ),
    models: {
      'deepseek-reasoner': 'Reasoner - Optimized for analysis',
      'deepseek-chat': 'Chat - Best for general tasks',
      'deepseek-coder': 'Coder - Specialized for programming'
    }
  },
  'OpenAI': {
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" fill="currentColor"/>
      </svg>
    ),
    models: {
      'gpt-4-turbo': 'GPT-4 Turbo - Latest version',
      'gpt-4': 'GPT-4 - Stable version',
      'gpt-4o': 'GPT-4o - Quality optimized',
      'gpt-4o-mini': 'GPT-4o Mini - Speed optimized',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo - Fast and efficient'
    }
  },
  'Anthropic': {
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
        <path d="M15.4 0a8.6 8.6 0 0 0-8.6 8.6v6.8A8.6 8.6 0 0 0 15.4 24a8.6 8.6 0 0 0 8.6-8.6V8.6A8.6 8.6 0 0 0 15.4 0zm0 2.6a6 6 0 0 1 6 6v6.8a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8.6a6 6 0 0 1 6-6z" fill="currentColor"/>
      </svg>
    ),
    models: {
      'claude-3-opus': 'Claude 3 Opus - Most powerful',
      'claude-3-sonnet': 'Claude 3 Sonnet - Balanced performance',
      'claude-2': 'Claude 2 - Stable version'
    }
  },
  'Google': {
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
      </svg>
    ),
    models: {
      'gemini-pro': 'Gemini Pro - Latest version',
      'gemini-pro-vision': 'Gemini Pro Vision - Multimodal'
    }
  },
  'Meta': {
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
      </svg>
    ),
    models: {
      'llama-2-70b': 'Llama 2 70B - Largest model',
      'llama-2-13b': 'Llama 2 13B - Balanced size',
      'llama-2-7b': 'Llama 2 7B - Compact version'
    }
  },
  'Mistral': {
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
      </svg>
    ),
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

  // Tìm tên hiển thị của model đang chọn
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
    if (lastQuery && rerunLastQuery) {
      rerunLastQuery();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-50 shadow-sm">
      <div className="relative">
        <button
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-left flex items-center gap-2 group transition-colors duration-200"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {Object.entries(modelGroups).map(([groupName, group]) => 
            selectedModel.includes(groupName.toLowerCase()) && group.logo
          )}
          <span className="font-medium text-sm">{selectedModelInfo.name}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-2 flex">
            {/* Model Groups */}
            <div className="w-[200px] border-r border-gray-100">
              {Object.entries(modelGroups).map(([groupName, group]) => (
                <div
                  key={groupName}
                  className={`px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${
                    hoveredGroup === groupName ? 'bg-gray-50' : ''
                  }`}
                  onMouseEnter={() => setHoveredGroup(groupName)}
                >
                  {group.logo}
                  <span className="text-sm font-medium">{groupName}</span>
                </div>
              ))}
            </div>

            {/* Models list with increased width */}
            <div className="w-[300px]">
              {hoveredGroup && Object.entries(modelGroups[hoveredGroup].models).map(([modelId, modelName]) => (
                <div
                  key={modelId}
                  className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                    selectedModel === modelId ? 'bg-gray-50' : ''
                  }`}
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

      <h1 className="text-2xl font-serif text-gray-900 tracking-tight flex items-center gap-3">
        FGTC Search
        <span className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-600 font-sans">Beta</span>
      </h1>
    </header>
  );
};

