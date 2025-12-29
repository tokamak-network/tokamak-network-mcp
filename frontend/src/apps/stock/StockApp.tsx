import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n';
import type { AppProps } from '../../types/app';

interface ExchangePrice {
  exchange: string;
  icon: string;
  pair: string;
  price: number | null;
  change24h: number | null;
  loading: boolean;
  error: string | null;
}

const EXCHANGES = [
  { id: 'upbit', name: 'Upbit', icon: '/exchanges/upbit.png', pair: 'KRW', domestic: true },
  { id: 'bithumb', name: 'Bithumb', icon: '/exchanges/bithumb.png', pair: 'KRW', domestic: true },
  { id: 'digifinex', name: 'DigiFinex', icon: '/exchanges/digifinex.png', pair: 'USDT', domestic: false },
  { id: 'biconomy', name: 'Biconomy', icon: '/exchanges/biconomy.png', pair: 'USDT', domestic: false },
];

export function StockApp({ onClose }: AppProps) {
  const { t } = useLanguage();
  const [prices, setPrices] = useState<ExchangePrice[]>(
    EXCHANGES.map(ex => ({
      exchange: ex.name,
      icon: ex.icon,
      pair: ex.domestic ? 'TOKAMAK/KRW' : 'TOKAMAK/USDT',
      price: null,
      change24h: null,
      loading: true,
      error: null,
    }))
  );

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

  // Fetch prices from exchanges
  useEffect(() => {
    const fetchPrices = async () => {
      // Upbit
      try {
        const upbitRes = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-TOKAMAK');
        const upbitData = await upbitRes.json();
        if (upbitData && upbitData[0]) {
          setPrices(prev => prev.map(p =>
            p.exchange === 'Upbit' ? {
              ...p,
              price: upbitData[0].trade_price,
              change24h: upbitData[0].signed_change_rate * 100,
              loading: false,
            } : p
          ));
        }
      } catch {
        setPrices(prev => prev.map(p =>
          p.exchange === 'Upbit' ? { ...p, loading: false, error: 'Failed to fetch' } : p
        ));
      }

      // Bithumb
      try {
        const bithumbRes = await fetch('https://api.bithumb.com/public/ticker/TOKAMAK_KRW');
        const bithumbData = await bithumbRes.json();
        if (bithumbData && bithumbData.data) {
          const data = bithumbData.data;
          const change = ((parseFloat(data.closing_price) - parseFloat(data.prev_closing_price)) / parseFloat(data.prev_closing_price)) * 100;
          setPrices(prev => prev.map(p =>
            p.exchange === 'Bithumb' ? {
              ...p,
              price: parseFloat(data.closing_price),
              change24h: change,
              loading: false,
            } : p
          ));
        }
      } catch {
        setPrices(prev => prev.map(p =>
          p.exchange === 'Bithumb' ? { ...p, loading: false, error: 'Failed to fetch' } : p
        ));
      }

      // DigiFinex
      try {
        const digifinexRes = await fetch('https://openapi.digifinex.com/v3/ticker?symbol=tokamak_usdt');
        const digifinexData = await digifinexRes.json();
        if (digifinexData && digifinexData.ticker && digifinexData.ticker[0]) {
          const ticker = digifinexData.ticker[0];
          setPrices(prev => prev.map(p =>
            p.exchange === 'DigiFinex' ? {
              ...p,
              price: parseFloat(ticker.last),
              change24h: parseFloat(ticker.change),
              loading: false,
            } : p
          ));
        }
      } catch {
        setPrices(prev => prev.map(p =>
          p.exchange === 'DigiFinex' ? { ...p, loading: false, error: 'Failed to fetch' } : p
        ));
      }

      // Biconomy
      try {
        const biconomyRes = await fetch('https://www.biconomy.com/api/v1/tickers', {
          headers: { 'X-SITE-ID': '127' },
        });
        const biconomyData = await biconomyRes.json();
        if (biconomyData && biconomyData.ticker) {
          const tonTicker = biconomyData.ticker.find((t: { symbol: string }) => t.symbol === 'TOKAMAK_USDT');
          if (tonTicker) {
            const change = parseFloat(tonTicker.change);
            setPrices(prev => prev.map(p =>
              p.exchange === 'Biconomy' ? {
                ...p,
                price: parseFloat(tonTicker.last),
                change24h: change,
                loading: false,
              } : p
            ));
          } else {
            setPrices(prev => prev.map(p =>
              p.exchange === 'Biconomy' ? { ...p, loading: false, error: 'Pair not found' } : p
            ));
          }
        }
      } catch {
        setPrices(prev => prev.map(p =>
          p.exchange === 'Biconomy' ? { ...p, loading: false, error: 'Failed to fetch' } : p
        ));
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number | null, pair: string) => {
    if (price === null) return '—';
    if (pair.includes('KRW')) {
      return `₩${price.toLocaleString('ko-KR')}`;
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  };

  const formatChange = (change: number | null) => {
    if (change === null) return '—';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="relative w-full max-w-sm animate-fade-in pointer-events-auto"
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
              <span className="text-sm font-medium text-white/60">{t('stock.title')}</span>
            </div>
            <div className="w-3" />
          </div>

          {/* Window Content */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center border border-white/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('stock.title')}</h3>
                <p className="text-sm text-gray-400">{t('stock.subtitle')}</p>
              </div>
            </div>

            {/* Price List */}
            <div className="space-y-2">
              {prices.map((item) => (
                <div
                  key={item.exchange}
                  className="bg-gray-900/50 rounded-lg p-3 flex items-center gap-3"
                >
                  {/* Exchange Icon */}
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={item.icon}
                      alt={item.exchange}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/tokamak.svg';
                      }}
                    />
                  </div>

                  {/* Exchange Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{item.exchange}</span>
                      <span className="text-xs text-gray-500">{item.pair}</span>
                    </div>
                    {item.loading ? (
                      <div className="w-20 h-4 bg-gray-700 rounded animate-pulse mt-1" />
                    ) : item.error ? (
                      <span className="text-xs text-red-400">{item.error}</span>
                    ) : (
                      <span className="text-lg font-semibold text-white">
                        {formatPrice(item.price, item.pair)}
                      </span>
                    )}
                  </div>

                  {/* Change */}
                  <div className="text-right">
                    {item.loading ? (
                      <div className="w-14 h-5 bg-gray-700 rounded animate-pulse" />
                    ) : item.error ? null : (
                      <span className={`text-sm font-medium ${(item.change24h ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {formatChange(item.change24h)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 text-center pt-2">
              {t('stock.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
