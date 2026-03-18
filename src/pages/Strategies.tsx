import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import AllocateCard from '../components/AllocateCard';
import InstrumentsTable from '../components/InstrumentsTable';
import { Zap, TrendingUp, Shield, Activity, ArrowRight, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export const availableStrategies = [
  { 
    id: 'conservative',
    name: 'Conservative Growth', 
    description: 'Low-risk strategy focused on stablecoin lending and low-volatility liquidity pools.',
    apy: '134.52%', 
    risk: 'Low',
    tvl: 45200000,
    icon: Shield,
    color: 'emerald',
    daily_return: 0.37,
    weekly_return: 2.59,
    monthly_return: 11.21,
    details: {
      pairs: ['EURUSD', 'GBPUSD', 'USDCAD', 'BTCUSDT (Low Leverage)'],
      riskAppetite: 'Conservative. Focuses on capital preservation and steady, compounding returns. Ideal for investors looking to beat inflation with minimal drawdown.',
      mechanics: 'Utilizes market-neutral strategies, stablecoin yield farming, and low-leverage forex arbitrage. The AI monitors for low-volatility environments to execute high-probability trades.',
      maxDrawdown: '2-4%',
      recommendedDuration: '3-6 Months'
    }
  },
  { 
    id: 'balanced',
    name: 'Balanced Alpha', 
    description: 'Algorithmic trading strategy capturing momentum in top 20 crypto assets.',
    apy: '187.92%', 
    risk: 'Medium',
    tvl: 12800000,
    icon: TrendingUp,
    color: 'blue',
    daily_return: 0.52,
    weekly_return: 3.61,
    monthly_return: 15.66,
    details: {
      pairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'],
      riskAppetite: 'Moderate. Designed for investors comfortable with standard crypto market volatility, seeking to outperform holding (HODL) through active trend following.',
      mechanics: 'Employs advanced momentum indicators and machine learning to identify breakout patterns in major cryptocurrencies. Automatically adjusts stop-losses to lock in profits during uptrends.',
      maxDrawdown: '10-15%',
      recommendedDuration: '6-12 Months'
    }
  },
  { 
    id: 'aggressive',
    name: 'Aggressive Yield', 
    description: 'High-yield strategy utilizing complex derivatives and cross-chain arbitrage.',
    apy: '365.04%', 
    risk: 'High',
    tvl: 5400000,
    icon: Zap,
    color: 'orange',
    daily_return: 1.01,
    weekly_return: 7.02,
    monthly_return: 30.42,
    details: {
      pairs: ['XAUUSD (Gold)', 'US OIL', 'SILVER', 'GBPJPY'],
      riskAppetite: 'Aggressive. Suited for high-risk tolerant investors looking for maximum returns through leveraged commodity and volatile forex pairs.',
      mechanics: 'Executes high-frequency trades based on macroeconomic news sentiment, geopolitical events, and complex technical patterns. Uses dynamic leverage sizing based on AI confidence scores.',
      maxDrawdown: '20-25%',
      recommendedDuration: '12+ Months'
    }
  },
];

export default function Strategies({ session }: { session: any }) {
  const { formatCurrency } = useCurrency();
  const [balance, setBalance] = useState<number>(0);
  const [strategies, setStrategies] = useState<any[]>(availableStrategies);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfileAndSettings() {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('available_balance')
          .eq('id', session.user.id)
          .single();

        if (!profileError && profileData) {
          setBalance(profileData.available_balance);
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_strategies')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!settingsError && settingsData && settingsData.length > 0) {
          const parsedStrats = JSON.parse(settingsData[0].text);
          if (parsedStrats && parsedStrats.length > 0) {
            setStrategies(parsedStrats);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchProfileAndSettings();
  }, [session.user.id]);

  return (
    <DashboardLayout session={session}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-main">Investment Strategies</h2>
            <p className="text-muted mt-2">Explore and allocate capital to our automated trading algorithms.</p>
          </div>
        </div>

        {/* Allocation Card Section */}
        <div className="mb-16">
          <AllocateCard balance={balance} />
        </div>

        <div className="space-y-12">
          {strategies.map((strategy, index) => {
            const Icon = strategy.icon === 'Shield' ? Shield : strategy.icon === 'Zap' ? Zap : TrendingUp;
            const colorMap: Record<string, string> = {
              emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
              orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            };
            const textColors: Record<string, string> = {
              emerald: 'text-emerald-500',
              blue: 'text-blue-500',
              orange: 'text-orange-500',
            };
            const gradientColors: Record<string, string> = {
              emerald: 'from-emerald-500',
              blue: 'from-blue-500',
              orange: 'from-orange-500',
            };
            const btnColorMap: Record<string, string> = {
              emerald: 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]',
              blue: 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]',
              orange: 'bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]',
            };

            return (
              <div key={index} className="bg-card border border-main rounded-3xl p-8 md:p-10 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg">
                {/* Decorative gradient */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColors[strategy.color]} to-transparent opacity-50`} />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                  <div className="flex items-start space-x-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border flex-shrink-0 ${colorMap[strategy.color]}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-display font-bold text-main mb-2">{strategy.name}</h1>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted bg-muted px-3 py-1 rounded-full border border-main">
                          {strategy.risk} Risk
                        </span>
                        <span className="text-sm text-muted">Target APY: <strong className={textColors[strategy.color]}>{strategy.apy}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-none">
                  <p className="text-lg text-muted leading-relaxed mb-10">
                    {strategy.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-muted border border-main rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className={`w-5 h-5 ${textColors[strategy.color]}`} />
                        <h3 className="text-lg font-bold text-main m-0">Risk Appetite</h3>
                      </div>
                      <p className="text-muted text-sm leading-relaxed m-0">
                        {strategy.details.riskAppetite}
                      </p>
                    </div>

                    <div className="bg-muted border border-main rounded-2xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Zap className={`w-5 h-5 ${textColors[strategy.color]}`} />
                        <h3 className="text-lg font-bold text-main m-0">Strategy Mechanics</h3>
                      </div>
                      <p className="text-muted text-sm leading-relaxed m-0">
                        {strategy.details.mechanics}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-main mb-6 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-muted" />
                    <span>Traded Instruments</span>
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-10">
                    {strategy.details.pairs.map((pair) => (
                      <div key={pair} className="px-4 py-2 bg-muted border border-main rounded-lg text-sm font-medium text-muted flex items-center space-x-2">
                        <CheckCircle2 className={`w-4 h-4 ${textColors[strategy.color]}`} />
                        <span>{pair}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-main pt-8 flex flex-wrap gap-8">
                    <div>
                      <p className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Historical Max Drawdown</p>
                      <p className="text-xl font-bold text-main">{strategy.details.maxDrawdown}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Recommended Duration</p>
                      <p className="text-xl font-bold text-main">{strategy.details.recommendedDuration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Current TVL</p>
                      <p className="text-xl font-bold text-main">${(strategy.tvl / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Supported Instruments Section */}
        <div className="mt-16">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Layers className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-3xl font-display font-bold text-main">Supported Instruments & Spreads</h2>
          </div>
          <InstrumentsTable />
        </div>

      </div>
    </DashboardLayout>
  );
}
