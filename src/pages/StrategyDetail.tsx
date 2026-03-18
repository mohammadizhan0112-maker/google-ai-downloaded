import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Shield, TrendingUp, Zap, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function StrategyDetail({ session }: { session: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_strategies')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const parsedStrats = JSON.parse(data[0].text);
          const found = parsedStrats.find((s: any) => s.id === id);
          if (found) {
            setStrategy(found);
          }
        }
      } catch (err) {
        console.error('Error fetching strategy:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStrategy();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout session={session}>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading strategy details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!strategy) {
    return (
      <DashboardLayout session={session}>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold text-white mb-4">Strategy not found</h2>
          <button 
            onClick={() => navigate('/strategies')}
            className="text-emerald-500 hover:text-emerald-400 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Strategies</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

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

  const details = strategy.details || {
    pairs: [], riskAppetite: '', mechanics: '', maxDrawdown: '', recommendedDuration: ''
  };

  return (
    <DashboardLayout session={session}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <button 
          onClick={() => navigate('/strategies')}
          className="text-gray-400 hover:text-white flex items-center space-x-2 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Strategies</span>
        </button>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColors[strategy.color]} to-transparent opacity-50`} />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
            <div className="flex items-start space-x-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border flex-shrink-0 ${colorMap[strategy.color]}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">{strategy.name}</h1>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    {strategy.risk} Risk
                  </span>
                  <span className="text-sm text-gray-400">Target APY: <strong className={textColors[strategy.color]}>{strategy.apy}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 leading-relaxed mb-10">
              {strategy.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className={`w-5 h-5 ${textColors[strategy.color]}`} />
                  <h3 className="text-lg font-bold text-white m-0">Risk Appetite</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed m-0">
                  {details.riskAppetite}
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className={`w-5 h-5 ${textColors[strategy.color]}`} />
                  <h3 className="text-lg font-bold text-white m-0">Strategy Mechanics</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed m-0">
                  {details.mechanics}
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-gray-400" />
              <span>Traded Instruments</span>
            </h3>
            <div className="flex flex-wrap gap-3 mb-10">
              {details.pairs.map((pair) => (
                <div key={pair} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-gray-300 flex items-center space-x-2">
                  <CheckCircle2 className={`w-4 h-4 ${textColors[strategy.color]}`} />
                  <span>{pair}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-wrap gap-8">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Historical Max Drawdown</p>
                <p className="text-xl font-bold text-white">{details.maxDrawdown}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Recommended Duration</p>
                <p className="text-xl font-bold text-white">{details.recommendedDuration}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Current TVL</p>
                <p className="text-xl font-bold text-white">${(strategy.tvl / 1000000).toFixed(1)}M</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
