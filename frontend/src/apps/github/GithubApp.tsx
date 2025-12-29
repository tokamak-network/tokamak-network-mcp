import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n';
import type { AppProps } from '../../types/app';

interface Repository {
  name: string;
  description: string;
  url: string;
  language?: string;
  stars?: number;
}

const REPOSITORIES: Repository[] = [
  {
    name: 'ton-staking-v2',
    description: 'TON Staking V2 - Smart contracts for staking TON tokens on Tokamak Network',
    url: 'https://github.com/tokamak-network/ton-staking-v2',
    language: 'Solidity',
  },
];

export function GithubApp({ onClose }: AppProps) {
  const { t } = useLanguage();

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const openRepo = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="relative w-full max-w-md animate-fade-in pointer-events-auto"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/10">
          {/* Window Title Bar */}
          <div
            className="bg-gray-900/60 px-4 py-3 flex items-center border-b border-white/10 cursor-move select-none"
            onMouseDown={handleDragStart}
          >
            <button
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="group w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-white/60">{t('github.title')}</span>
            </div>
            <div className="w-3" />
          </div>

          {/* Window Content */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-white/20">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('github.title')}</h3>
                <p className="text-sm text-gray-400">{t('github.subtitle')}</p>
              </div>
            </div>

            {/* Repository List */}
            <div className="space-y-2">
              {REPOSITORIES.map((repo) => (
                <button
                  key={repo.name}
                  onClick={() => openRepo(repo.url)}
                  className="w-full bg-gray-900/50 hover:bg-gray-700/50 rounded-lg p-4 text-left transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-gray-600 transition-colors">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                          {repo.name}
                        </span>
                        <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                      {repo.language && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                          <span className="text-xs text-gray-500">{repo.language}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* View All Link */}
            <button
              onClick={() => openRepo('https://github.com/tokamak-network')}
              className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-2 transition-colors"
            >
              {t('github.viewAll')} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
