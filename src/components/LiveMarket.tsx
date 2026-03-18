import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { BTCLogo, ETHLogo, SOLLogo, BNBLogo, GoldLogo } from './CryptoLogos';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline: { value: number }[];
  isLive: boolean;
}

const generateSparkline = (currentPrice: number, change24h: number) => {
  const points = 42;
  const startPrice = currentPrice / (1 + change24h / 100);
  let currentVal = startPrice;
  const sparkline = [{ value: currentVal }];
  
  // Create a random walk that ends up at currentPrice
  const totalChange = currentPrice - startPrice;
  const stepChange = totalChange / points;
  
  for (let i = 1; i < points; i++) {
    const volatility = currentPrice * 0.005; // 0.5% volatility per step
    const randomMove = (Math.random() - 0.5) * volatility;
    currentVal += stepChange + randomMove;
    sparkline.push({ value: currentVal });
  }
  
  // Ensure the last point is exactly the current price
  sparkline[points - 1] = { value: currentPrice };
  return sparkline;
};

const INITIAL_DATA: Record<string, CoinData> = {
  bitcoin: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 67800.50, change24h: 2.5, sparkline: generateSparkline(67800.50, 2.5), isLive: true },
  ethereum: { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3450.20, change24h: 1.8, sparkline: generateSparkline(3450.20, 1.8), isLive: true },
  solana: { id: 'solana', symbol: 'SOL', name: 'Solana', price: 145.80, change24h: 5.2, sparkline: generateSparkline(145.80, 5.2), isLive: true },
  binancecoin: { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 590.40, change24h: 0.5, sparkline: generateSparkline(590.40, 0.5), isLive: true },
  gold: { id: 'gold', symbol: 'XAU', name: 'Gold', price: 2345.50, change24h: 0.8, sparkline: generateSparkline(2345.50, 0.8), isLive: true },
};

const ASSET_ORDER = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'gold'];

export default function LiveMarket({ isDashboard = false }: { isDashboard?: boolean }) {
  const [marketData, setMarketData] = useState<Record<string, CoinData>>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Connect to Binance WebSocket for instant crypto prices
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/bnbusdt@ticker/paxgusdt@ticker');

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const symbolMap: Record<string, string> = {
        'BTCUSDT': 'bitcoin',
        'ETHUSDT': 'ethereum',
        'SOLUSDT': 'solana',
        'BNBUSDT': 'binancecoin',
        'PAXGUSDT': 'gold'
      };

      const id = symbolMap[data.s];
      if (id) {
        setMarketData(prev => {
          const current = prev[id];
          if (!current) return prev;
          
          const newPrice = parseFloat(data.c);
          const newChange = parseFloat(data.P);
          
          return {
            ...prev,
            [id]: {
              ...current,
              price: newPrice,
              change24h: newChange,
              // Update the last point of the sparkline to connect to the live price
              sparkline: [...current.sparkline.slice(0, -1), { value: newPrice }]
            }
          };
        });
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    // 2. Fetch 7D historical data for sparklines
    const fetchHistoricalData = async () => {
      const symbols = [
        { id: 'bitcoin', symbol: 'BTCUSDT' },
        { id: 'ethereum', symbol: 'ETHUSDT' },
        { id: 'solana', symbol: 'SOLUSDT' },
        { id: 'binancecoin', symbol: 'BNBUSDT' },
        { id: 'gold', symbol: 'PAXGUSDT' }
      ];

      try {
        const promises = symbols.map(async ({ id, symbol }) => {
          try {
            const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=4h&limit=42`);
            const data = await res.json();
            if (Array.isArray(data)) {
              const sparkline = data.map((kline: any) => ({ value: parseFloat(kline[4]) })); // Close price
              return { id, sparkline };
            }
          } catch (e) {
            // Silently fail for individual coins and use fallback
          }
          return null;
        });

        const results = await Promise.all(promises);
        
        setMarketData(prev => {
          const newData = { ...prev };
          results.forEach(result => {
            if (result && newData[result.id]) {
              newData[result.id] = {
                ...newData[result.id],
                sparkline: result.sparkline
              };
            }
          });
          return newData;
        });
      } catch (error) {
        console.warn('Could not fetch live historical data, using fallback sparklines.');
      }
    };

    fetchHistoricalData();

    return () => {
      ws.close();
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price < 1000 ? 2 : 0,
      maximumFractionDigits: price < 1000 ? 2 : 0,
    }).format(price);
  };

  return (
    <section className={`${isDashboard ? 'py-0' : 'py-24 bg-main border-t border-main'} relative overflow-hidden`}>
      {/* Abstract Background Elements */}
      {!isDashboard && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -ml-64 -mb-64" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] select-none">
            <Activity className="w-[600px] h-[600px] text-main" />
          </div>
        </div>
      )}

      <div className={isDashboard ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-2 bg-muted border border-main rounded-full px-4 py-2 mb-6"
            >
              <Activity className={`w-4 h-4 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`} />
              <span className="text-sm font-medium text-muted">
                {isConnected ? 'Live Market Data' : 'Connecting to Live Feed...'}
              </span>
              {isConnected && (
                <span className="ml-2 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Live API
                </span>
              )}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-display font-bold text-main tracking-tight"
            >
              Real-time Intelligence
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted mt-4 md:mt-0 max-w-sm"
          >
            Track the pulse of the market with our ultra-low latency data feeds for crypto and commodities.
          </motion.p>
        </div>

        <div className="bg-card border border-main rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[500px] md:min-w-full">
              <thead>
                <tr className="border-b border-main bg-muted/50">
                  <th className="py-4 px-4 sm:py-5 sm:px-6 text-xs font-medium text-muted uppercase tracking-wider">Asset</th>
                  <th className="py-4 px-4 sm:py-5 sm:px-6 text-xs font-medium text-muted uppercase tracking-wider">Price</th>
                  <th className="py-4 px-4 sm:py-5 sm:px-6 text-xs font-medium text-muted uppercase tracking-wider">24h Change</th>
                  <th className="py-4 px-4 sm:py-5 sm:px-6 text-xs font-medium text-muted uppercase tracking-wider">7D Trend</th>
                  <th className="py-4 px-4 sm:py-5 sm:px-6 text-right text-xs font-medium text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4 sm:py-5 sm:px-6"><div className="h-10 w-24 sm:w-32 bg-muted rounded-lg"></div></td>
                      <td className="py-4 px-4 sm:py-5 sm:px-6"><div className="h-6 w-20 sm:w-24 bg-muted rounded"></div></td>
                      <td className="py-4 px-4 sm:py-5 sm:px-6"><div className="h-6 w-12 sm:w-16 bg-muted rounded"></div></td>
                      <td className="py-4 px-4 sm:py-5 sm:px-6"><div className="h-10 w-24 sm:w-32 bg-muted rounded-lg"></div></td>
                      <td className="py-4 px-4 sm:py-5 sm:px-6 text-right"><div className="h-8 w-16 sm:w-20 bg-muted rounded-lg ml-auto"></div></td>
                    </tr>
                  ))
                ) : (
                  ASSET_ORDER.map((id, index) => {
                    const coin = marketData[id];
                    if (!coin) return null;
                    const isPositive = coin.change24h >= 0;
                    
                    const LogoComponent = 
                      coin.symbol === 'BTC' ? BTCLogo :
                      coin.symbol === 'ETH' ? ETHLogo :
                      coin.symbol === 'SOL' ? SOLLogo :
                      coin.symbol === 'BNB' ? BNBLogo :
                      coin.symbol === 'XAU' ? GoldLogo :
                      () => <div className="w-full h-full flex items-center justify-center font-bold text-main text-sm">{coin.symbol[0]}</div>;

                    return (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={coin.id}
                        className="hover:bg-muted transition-colors group cursor-pointer"
                      >
                        <td className="py-4 px-4 sm:py-5 sm:px-6">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center relative flex-shrink-0 no-invert">
                              <LogoComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                              {/* Live indicator dot */}
                              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full border-2 border-main"></span>
                            </div>
                            <div>
                              <div className="font-bold text-main text-sm sm:text-base">{coin.name}</div>
                              <div className="text-xs text-muted">{coin.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:py-5 sm:px-6">
                          {/* Add a subtle flash animation when price updates */}
                          <motion.div 
                            key={coin.price}
                            initial={{ color: 'var(--color-emerald-500)' }}
                            animate={{ color: 'currentColor' }}
                            transition={{ duration: 1 }}
                            className="font-medium text-main text-sm sm:text-base"
                          >
                            {formatPrice(coin.price)}
                          </motion.div>
                        </td>
                        <td className="py-4 px-4 sm:py-5 sm:px-6">
                          <div className={`flex items-center space-x-1 font-medium text-sm sm:text-base ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                            <span>{Math.abs(coin.change24h).toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:py-5 sm:px-6 w-32 sm:w-48">
                          <div className="h-10 sm:h-12 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={coin.sparkline}>
                                <YAxis domain={['dataMin', 'dataMax']} hide />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke={isPositive ? 'var(--color-emerald-500)' : '#f87171'}
                                  strokeWidth={2}
                                  dot={false}
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:py-5 sm:px-6 text-right">
                          <button className="text-xs sm:text-sm font-medium text-main bg-muted hover:bg-emerald-500 hover:text-white hover:scale-110 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-main hover:border-emerald-400 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 active:scale-95">
                            Trade
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
