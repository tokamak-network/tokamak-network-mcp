import { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { useLanguage } from '../../i18n';
import type { AppProps } from '../../types/app';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY_API = 'tokamak_groq_api_key';
const STORAGE_KEY_MESSAGES = 'tokamak_terminal_messages';

const TOKAMAK_SYSTEM_PROMPT = `You are Tokamak Network AI Assistant(aka AI Global_Tokamak), an AI community manager on Tokamak Network - an on-demand Ethereum Layer 2 platform.

Key Information:
- Tokamak Network enables building and connecting customized Layer 2 networks
- TON is the native token, WTON is the wrapped version (1 TON = 1 WTON, but WTON has 27 decimals for precision)
- Staking: Users can stake TON/WTON to Layer2 operators to secure the network and earn seigniorage rewards
- DAO: TON holders can participate in governance through the Tokamak Network DAO
- Thanos Stack: A complete L2 solution based on OP Stack for building application-specific L2s

IMPORTANT - Community Version Transition:
The official Staking and DAO web interfaces have been discontinued and transitioned to community-maintained versions. Users should now use the community versions:
- Staking Community Version: https://github.com/tokamak-network/staking-community-version
- DAO Community Version: https://github.com/tokamak-network/dao-community-version
The previous official URLs (staking.tokamak.network, dao.tokamak.network) are no longer available.

Important Links:
- Documentation: https://docs.tokamak.network
- Website: https://tokamak.network
- Staking (Community): https://github.com/tokamak-network/staking-community-version
- DAO (Community): https://github.com/tokamak-network/dao-community-version

Frequently Asked Questions:
Q: Where can I stake $TOKAMAK?
A: You can stake $TOKAMAK here: https://staking-community-version.vercel.app/

Q: Where can I join official Tokamak Network community discussions?
A: Official community discussions are currently available on two platforms:
   - Discord: discord.gg/XrHXrDTuNd
   - Telegram: t.me/tokamak_network

Q: Where can I trade $TOKAMAK?
A: $TOKAMAK is currently available for trading on the following exchanges: UPBIT, BITHUMB, DIGIFINEX, COINONE, XT.COM, WEEX, BICONOMY and GOPAX. Please always verify trading pairs and availability directly on each exchange.

Contract Addresses (Ethereum Mainnet):
- TON: 0x2be5e8c109e2197D077D13A82dAead6a9b3433C5
- WTON: 0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2
- DepositManager: 0x56E465f654393fa48f007Ed7346105c7195CEe43
- SeigManager: 0x710936500aC59e8551331871Cbad3D33d5e0D909

Layer2 Operators (Mainnet): tokamak1, DXM_Corp, DSRV, Talken, staked, level, decipher, DeSpread, Danal_Fintech, Hammer

When introducing yourself, include: "If you'd like to find my other self, please come to the Tokamak Network Discord channel (https://discord.com/invite/SZw2WSR) and look for me."

Always be helpful, accurate, and concise. Provide references to official documentation when possible. Answer in the same language as the user's question.`;

export function TerminalApp({ onClose }: AppProps) {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY_API) || '');
  const [tempApiKey, setTempApiKey] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      localStorage.setItem(STORAGE_KEY_API, tempApiKey.trim());
    }
    setTempApiKey('');
    setShowSettings(false);
  };

  const handleOpenSettings = () => {
    setTempApiKey(apiKey);
    setShowSettings(true);
  };

  const handleClearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !apiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: TOKAMAK_SYSTEM_PROMPT },
            ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="relative w-full max-w-lg animate-fade-in pointer-events-auto"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col" style={{ height: '500px' }}>
          {/* Window Title Bar */}
          <div
            className="bg-gray-900/60 px-4 py-3 flex items-center border-b border-white/10 cursor-move select-none flex-shrink-0"
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
              <span className="text-sm font-medium text-white/60">{t('terminal.title')}</span>
            </div>
            <button
              onClick={() => showSettings ? setShowSettings(false) : handleOpenSettings()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-4 h-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-gray-900/80 border-b border-white/10 flex-shrink-0">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Groq API Key</label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder={t('terminal.apiKeyPlaceholder')}
                    className="w-full bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveApiKey}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-400 rounded text-sm font-medium transition-colors"
                  >
                    {t('terminal.saveApiKey')}
                  </button>
                  <button
                    onClick={handleClearMessages}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
                  >
                    {t('terminal.clear')}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Get your free API key at{' '}
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    console.groq.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* API Key Required */}
          {!apiKey && !showSettings ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('terminal.title')}</h3>
                  <p className="text-sm text-gray-400 mt-1">{t('terminal.subtitle')}</p>
                </div>
                <p className="text-sm text-yellow-400">{t('terminal.apiKeyRequired')}</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded text-sm font-medium transition-colors"
                >
                  {t('terminal.settings')}
                </button>
              </div>
            </div>
          ) : apiKey && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                {messages.length === 0 && (
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full flex-shrink-0">
                      <img src="/tokamak.svg" alt="Tokamak" className="w-4 h-4" />
                      <span className="text-xs font-medium text-gray-800">AI Global_Tokamak</span>
                    </div>
                    <span className="text-gray-400 pt-1">{t('terminal.welcome')}</span>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={msg.role === 'user' ? 'text-green-400' : 'text-gray-300'}>
                    {msg.role === 'user' ? (
                      <div className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">&gt;</span>
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full flex-shrink-0">
                          <img src="/tokamak.svg" alt="Tokamak" className="w-4 h-4" />
                          <span className="text-xs font-medium text-gray-800">AI Global_Tokamak</span>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-gray-900 prose-pre:text-gray-300 prose-code:text-purple-400 prose-code:before:content-none prose-code:after:content-none prose-a:text-blue-400 pt-0.5">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full flex-shrink-0">
                      <img src="/tokamak.svg" alt="Tokamak" className="w-4 h-4" />
                      <span className="text-xs font-medium text-gray-800">AI Global_Tokamak</span>
                    </div>
                    <span className="text-gray-400 animate-pulse pt-1">{t('terminal.thinking')}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-white/10 p-3 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('terminal.placeholder')}
                  disabled={isLoading}
                  className="flex-1 bg-gray-900/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                >
                  {t('terminal.send')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
