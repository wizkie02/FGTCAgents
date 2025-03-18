'use client';

import { TavilyResponse } from '../../types/types';

interface TavilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: TavilyResponse;
}

export const TavilyModal = ({ isOpen, onClose, data }: TavilyModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Full Tavily Response</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};
