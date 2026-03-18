import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ArrowUpRight, ArrowDownRight, 
  TrendingUp, CreditCard, ChevronRight, Calculator, PieChart, Users, Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import AllocateCard from '../components/AllocateCard';
import LiveMarket from '../components/LiveMarket';
import { useCurrency } from '../contexts/CurrencyContext';
import { analyzeUserActivity } from '../services/geminiService';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';

interface Profile {
  full_name: string;
  available_balance: number;
  allocated_balance: number;
  referral_balance: number;
}

type Timeframe = '1D' | '1W' | '1M' | 'ALL';

const DEFAULT_STRATEGIES = [
  { id: 'conservative', name: 'Conservative Growth', apy: '134.52%', risk: 'Low', color: 'emerald', type: 'Conservative', daily_return: 0.37, weekly_return: 2.59, monthly_return: 11.21 },
  { id: 'balanced', name: 'Balanced Alpha', apy: '187.92%', risk: 'Medium', color: 'blue', type: 'Balanced', daily_return: 0.52, weekly_return: 3.61, monthly_return: 15.66 },
  { id: 'aggressive', name: 'Aggressive Yield', apy: '365.04%', risk: 'High', color: 'orange', type: 'Aggressive', daily_return: 1.01, weekly_return: 7.02, monthly_return: 30.42 }
];

export default function Dashboard({ session }: { session: any }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [timeframe, setTimeframe] = useState<Timeframe>('1W');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalYield, setTotalYield] = useState<number>(0);
  const [allocatedAmount, setAllocatedAmount] = useState<number>(0);
  const { formatCurrency, currency, rates } = useCurrency();
  const navigate = useNavigate();

  const [strategies, setStrategies] = useState<any[]>(DEFAULT_STRATEGIES);
  const [strategyApys, setStrategyApys] = useState<Record<string, number>>({});
  const [strategyYields, setStrategyYields] = useState<Record<string, number>>({});
  const [strategyInvestments, setStrategyInvestments] = useState<Record<string, number>>({});
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [performanceLogs, setPerformanceLogs] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const portfolioValue = (profile?.available_balance || 0) + (profile?.allocated_balance || 0) + (profile?.referral_balance || 0);
  const principal = portfolioValue - totalYield;
  const growthPercent = principal > 0 ? (totalYield / principal) * 100 : 0;

  // Generate chart data based on actual performance logs
  const getChartData = () => {
    if (performanceLogs.length === 0) {
      // Fallback to generated data if no logs
      const generateChartData = (points: number) => {
        const data = [];
        const startValue = principal;
        const endValue = portfolioValue;
        const difference = endValue - startValue;
        
        for (let i = 0; i < points; i++) {
          const progress = i / (points - 1);
          const randomJitter = (Math.random() - 0.5) * (difference * 0.05);
          let value = startValue + (difference * progress);
          if (i > 0 && i < points - 1) value += randomJitter;
          data.push({ name: `Point ${i}`, value: Math.max(0, value) });
        }
        return data;
      };

      switch (timeframe) {
        case '1D': return generateChartData(24).map((d, i) => ({ ...d, name: `${i}:00` }));
        case '1M': return generateChartData(30).map((d, i) => ({ ...d, name: `Day ${i+1}` }));
        case 'ALL': return generateChartData(12).map((d, i) => ({ ...d, name: `Month ${i+1}` }));
        case '1W':
        default: return generateChartData(7).map((d, i) => ({ ...d, name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] }));
      }
    }

    // Filter logs by timeframe
    const now = new Date();
    let filteredLogs = [...performanceLogs];
    
    if (timeframe === '1D') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filteredLogs = performanceLogs.filter(log => new Date(log.date) >= oneDayAgo);
    } else if (timeframe === '1W') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = performanceLogs.filter(log => new Date(log.date) >= oneWeekAgo);
    } else if (timeframe === '1M') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = performanceLogs.filter(log => new Date(log.date) >= oneMonthAgo);
    }

    // Sort by date
    filteredLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Map to chart data
    // We want to show cumulative growth
    let currentVal = principal;
    return filteredLogs.map(log => {
      // Calculate growth based on returnPercent
      // This is a simplification: we assume the user was invested in all strategies
      // In a real app, we'd only apply the return to the user's specific allocations
      currentVal = currentVal * (1 + (log.returnPercent / 100));
      return {
        name: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: currentVal
      };
    });
  };

  const convertedChartData = getChartData().map(data => ({
    ...data,
    value: data.value * rates[currency]
  }));

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, available_balance, allocated_balance, referral_balance')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch transactions
        // Fetch strategies
        const { data: settingsData, error: settingsError } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_strategies')
          .order('created_at', { ascending: false })
          .limit(1);

        let currentStrategies: any[] = [];
        if (!settingsError && settingsData && settingsData.length > 0) {
          const parsedStrats = JSON.parse(settingsData[0].text);
          if (parsedStrats && parsedStrats.length > 0) {
            currentStrategies = parsedStrats;
            setStrategies(parsedStrats);
            
            const initialApys: Record<string, number> = {};
            parsedStrats.forEach((s: any) => {
              const cleanApy = typeof s.apy === 'string' ? parseFloat(s.apy.replace(/[+%]/g, '')) : (s.apy || 0);
              initialApys[s.id] = cleanApy;
            });
            setStrategyApys(initialApys);
          }
        } else {
          // Keep default strategies if none in DB
          setStrategies(DEFAULT_STRATEGIES);
          const initialApys: Record<string, number> = {};
          DEFAULT_STRATEGIES.forEach(s => {
            initialApys[s.id] = parseFloat(s.apy);
          });
          setStrategyApys(initialApys);
        }

        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!txError && txData) {
          setTransactions(txData);
          
          // Calculate balance from completed transactions
          let yieldEarned = 0;
          let allocated = 0;
          
          txData.forEach(tx => {
            if (tx.status === 'completed') {
              if (tx.type === 'yield') {
                yieldEarned += Number(tx.amount);
              }
              if (tx.type === 'strategy_allocation') {
                allocated += Number(tx.amount);
              }
              if (tx.type === 'strategy_withdrawal') {
                allocated -= Number(tx.amount);
              }
            }
          });
          
          setTotalYield(yieldEarned);
          setAllocatedAmount(allocated);
        }

        // Fetch trade logs for APY calculation
        const { data: tradeLogData, error: tradeLogError } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'trade_log');

        if (!tradeLogError && tradeLogData && tradeLogData.length > 0 && currentStrategies.length > 0) {
          const strategyStats: Record<string, { margin: number, profit: number }> = {};
          currentStrategies.forEach(s => { strategyStats[s.id] = { margin: 0, profit: 0 }; });

          tradeLogData.forEach(log => {
            try {
              const logData = JSON.parse(log.text);
              if (strategyStats[logData.strategyId]) {
                strategyStats[logData.strategyId].margin += Number(logData.margin);
                strategyStats[logData.strategyId].profit += Number(logData.profit);
              }
            } catch (e) {}
          });

          const newApys = { ...strategyApys };
          for (const [id, stats] of Object.entries(strategyStats)) {
            if (stats.margin > 0) {
              const rawReturn = (stats.profit / stats.margin) * 100;
              const baseApy = currentStrategies.find(s => s.id === id)?.apy || 0;
              newApys[id] = Math.max(baseApy, parseFloat(rawReturn.toFixed(2)));
            }
          }
          setStrategyApys(newApys);
        }

        // Fetch performance logs
        const { data: perfData, error: perfError } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'strategy_performance_log')
          .order('created_at', { ascending: false });

        if (!perfError && perfData) {
          const logs = perfData.map(d => JSON.parse(d.text));
          setPerformanceLogs(logs);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${session.user.id}` }, payload => {
        console.log('Transaction change received!', payload);
        fetchData(); // Refetch data on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session.user.id]);

  // Update strategies with actual values
  useEffect(() => {
    const yields: Record<string, number> = {};
    const investments: Record<string, number> = {};
    
    strategies.forEach(s => {
      yields[s.id] = 0;
      investments[s.id] = 0;
    });
    
    transactions.forEach(tx => {
      if (tx.status === 'completed' && tx.strategy) {
        // Find strategy ID (either direct match or by name)
        const strat = strategies.find(s => s.id === tx.strategy || s.name === tx.strategy);
        const stratId = strat ? strat.id : null;
        
        if (stratId) {
          if (tx.type === 'yield') {
            yields[stratId] += Number(tx.amount);
          } else if (tx.type === 'strategy_allocation') {
            investments[stratId] += Number(tx.amount);
          } else if (tx.type === 'strategy_withdrawal') {
            investments[stratId] -= Number(tx.amount);
          }
        }
      }
    });

    setStrategyYields(yields);
    setStrategyInvestments(investments);
  }, [transactions, strategies]);

  const totalStrategyInvestment = (Object.values(strategyInvestments) as number[]).reduce((a, b) => a + Math.max(0, b), 0);

  const activeStrategies = strategies.map(s => {
    const value = Math.max(0, strategyInvestments[s.id] || 0);
    const logs = performanceLogs.filter(log => log.strategyId === s.id);
    const avgHistoricalReturn = logs.length > 0 
      ? (logs.reduce((sum, log) => sum + log.returnPercent, 0) / logs.length)
      : null;

    const cleanApy = typeof s.apy === 'string' ? parseFloat(s.apy.replace(/[+%]/g, '')) : (s.apy || 0);
    const currentApy = strategyApys[s.id] || cleanApy;

    // Calculate returns based on APY or historical data
    const dailyReturn = avgHistoricalReturn !== null ? avgHistoricalReturn : (s.daily_return || (currentApy / 365));
    const weeklyReturn = s.weekly_return || (currentApy / 52);
    const monthlyReturn = s.monthly_return || (currentApy / 12);

    return {
      name: s.name,
      allocation: totalStrategyInvestment > 0 ? Math.round((value / totalStrategyInvestment) * 100) : 0,
      value: value,
      profit: strategyYields[s.id] || 0,
      apy: `+${currentApy}%`,
      daily_return: Number(dailyReturn).toFixed(2),
      weekly_return: Number(weeklyReturn).toFixed(2),
      monthly_return: Number(monthlyReturn).toFixed(2),
      color: s.color === 'emerald' ? '#10b981' : s.color === 'blue' ? '#3b82f6' : '#f59e0b',
      id: s.id,
      avgHistoricalReturn: avgHistoricalReturn ? avgHistoricalReturn.toFixed(2) : null,
      type: s.type || (s.risk === 'High' ? 'Aggressive' : s.risk === 'Low' ? 'Conservative' : 'Balanced')
    };
  });

  // Calculate returns based on average APY
  const averageApy = activeStrategies.length > 0 
    ? activeStrategies.reduce((acc, s) => acc + parseFloat(s.apy.replace('+', '').replace('%', '')), 0) / activeStrategies.length
    : 0;
  
  const yearlyReturn = portfolioValue * (averageApy / 100);
  const monthlyReturn = yearlyReturn / 12;
  const weeklyReturn = yearlyReturn / 52;
  const dailyReturn = yearlyReturn / 365;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const insight = await analyzeUserActivity(profile, transactions);
      setAiInsight(insight);
    } catch (error) {
      console.error('Analysis Error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout session={session}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Balance Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-card via-card/90 to-card border border-main rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 hover:shadow-glow-emerald">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-150 group-hover:bg-emerald-500/20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0">
                <div>
                  <p className="text-muted font-bold mb-1 uppercase text-[10px] tracking-[0.2em]">Overall Funds</p>
                  <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-main text-glow-emerald">
                    {loading ? formatCurrency(0) : formatCurrency(portfolioValue)}
                  </h2>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/20 self-start sm:self-auto shadow-glow-emerald">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold tracking-tight">+{growthPercent.toFixed(2)}% ({formatCurrency(totalYield, true)})</span>
                </div>
              </div>

              {/* Fund Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-muted border border-main p-5 rounded-2xl hover:bg-main/10 transition-colors group/item">
                  <p className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">Account Balance</p>
                  <p className="text-xl font-bold text-main group-hover/item:text-emerald-400 transition-colors">{formatCurrency(profile?.available_balance || 0)}</p>
                </div>
                <div className="bg-muted border border-main p-5 rounded-2xl hover:bg-main/10 transition-colors group/item">
                  <p className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">Allocated Funds</p>
                  <p className="text-xl font-bold text-main group-hover/item:text-blue-400 transition-colors">{formatCurrency(profile?.allocated_balance || 0)}</p>
                </div>
                <div className="bg-muted border border-main p-5 rounded-2xl hover:bg-main/10 transition-colors group/item">
                  <p className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">Referral Funds</p>
                  <p className="text-xl font-bold text-main group-hover/item:text-cyan-400 transition-colors">{formatCurrency(profile?.referral_balance || 0)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => navigate('/deposit')}
                  className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center space-x-2"
                >
                  <ArrowDownRight className="w-5 h-5" />
                  <span>Deposit</span>
                </button>
                <button 
                  onClick={() => navigate('/withdraw')}
                  className="flex-1 sm:flex-none bg-muted hover:bg-main/10 text-main font-medium py-3 px-6 rounded-xl border border-main transition-all flex items-center justify-center space-x-2"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Withdraw</span>
                </button>
                <button 
                  onClick={() => navigate('/sell')}
                  className="flex-1 sm:flex-none bg-muted hover:bg-main/10 text-main font-medium py-3 px-6 rounded-xl border border-main transition-all flex items-center justify-center space-x-2"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Sell Crypto</span>
                </button>
                <button 
                  onClick={() => navigate('/referral')}
                  className="flex-1 sm:flex-none bg-muted hover:bg-main/10 text-main font-medium py-3 px-6 rounded-xl border border-main transition-all flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>Referral</span>
                </button>
              </div>
            </div>
          </div>

          {/* Yield Card */}
          <div className="bg-card border border-main rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <PieChart className="w-24 h-24" />
            </div>
            <div>
              <p className="text-muted font-medium mb-1">Total Yield Earned</p>
              <h3 className="text-3xl font-display font-bold text-emerald-400">{formatCurrency(totalYield, true)}</h3>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Daily Returns</span>
                <span className="text-main font-medium">{formatCurrency(dailyReturn, true)}</span>
              </div>
              <div className="w-full h-px bg-main/10"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Weekly Returns</span>
                <span className="text-main font-medium">{formatCurrency(weeklyReturn, true)}</span>
              </div>
              <div className="w-full h-px bg-main/10"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Monthly Returns</span>
                <span className="text-main font-medium">{formatCurrency(monthlyReturn, true)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-card border border-main rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0">
            <div>
              <h3 className="text-xl font-display font-bold text-main">Performance History</h3>
              <p className="text-sm text-muted">
                Portfolio growth over the last {timeframe === '1D' ? '24 hours' : timeframe === '1W' ? '7 days' : timeframe === '1M' ? '30 days' : 'year'}
              </p>
            </div>
            <div className="flex bg-muted rounded-lg p-1 border border-main w-full sm:w-auto justify-between sm:justify-start">
              {(['1D', '1W', '1M', 'ALL'] as Timeframe[]).map((tf) => (
                <button 
                  key={tf} 
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeframe === tf ? 'bg-card text-main shadow-sm' : 'text-muted hover:text-main'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full relative group/chart">
            {/* Abstract Aesthetic Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Technical Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.03]" 
                   style={{ backgroundImage: 'radial-gradient(circle, var(--text-main) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
              />
              
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
              
              {/* Floating Symbols */}
              <motion.div 
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-20 opacity-10"
              >
                <TrendingUp className="w-12 h-12 text-emerald-500" />
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-20 opacity-10"
              >
                <Activity className="w-10 h-10 text-blue-500" />
              </motion.div>

              {/* Watermark Logo */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-48 h-48 text-main" />
                  <span className="text-4xl font-display font-bold tracking-[0.5em] uppercase mt-4">.</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={convertedChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  tick={{fill: 'var(--text-muted)', fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  tick={{fill: 'var(--text-muted)', fontSize: 12}}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
                    return `${symbol}${value/1000}k`;
                  }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', borderRadius: '12px', color: 'var(--text-main)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  formatter={(value: number) => [
                    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value), 
                    'Value'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* AI Portfolio Insights */}
        <div className="bg-card border border-main rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BrainCircuit className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-xl font-display font-bold flex items-center text-main">
                  <Sparkles className="w-5 h-5 mr-2 text-emerald-500" />
                  AI Portfolio Insights
                </h3>
                <p className="text-sm text-muted">Get personalized analysis and recommendations for your portfolio</p>
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Portfolio'}</span>
              </button>
            </div>

            {aiInsight ? (
              <div className="bg-muted border border-main rounded-2xl p-6 text-main text-sm leading-relaxed animate-in fade-in slide-in-from-top-4 duration-500">
                {aiInsight}
              </div>
            ) : (
              <div className="border-2 border-dashed border-main rounded-2xl p-12 text-center">
                <p className="text-muted text-sm">Click the button above to generate AI-powered insights based on your recent activity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Allocate Assets Card */}
        <div className="mt-8">
          <AllocateCard balance={profile?.available_balance || 0} />
        </div>

        {/* Bottom Grid: Allocations & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Allocations */}
          <div className="bg-card border border-main rounded-3xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-main">Active Allocations</h3>
              <button className="text-emerald-500 text-sm font-medium hover:text-emerald-400 flex items-center">
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="space-y-6">
              {activeStrategies.map((strategy, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="font-medium text-main">{strategy.name}</p>
                      <p className="text-sm text-muted">{formatCurrency(strategy.value)} • <span className="text-emerald-500">Yield: {formatCurrency(strategy.profit, true)}</span></p>
                    </div>
                    <span className="text-sm font-bold text-main">{strategy.allocation}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${strategy.allocation}%`, backgroundColor: strategy.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-main rounded-3xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-main">Recent Activity</h3>
              <button className="text-muted hover:text-main transition-colors">
                <Activity className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-muted text-center py-4">No recent activity</p>
              ) : (
                transactions.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-main hover:bg-main/10 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        activity.type === 'yield' ? 'bg-emerald-500/10 text-emerald-500' :
                        activity.type === 'deposit' ? 'bg-blue-500/10 text-blue-500' :
                        activity.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' :
                        'bg-orange-500/10 text-orange-500'
                      }`}>
                        {activity.type === 'yield' ? <TrendingUp className="w-5 h-5" /> :
                         activity.type === 'deposit' ? <ArrowDownRight className="w-5 h-5" /> :
                         activity.type === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> :
                         <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-main capitalize">{activity.type}</p>
                        <p className="text-xs text-muted">{activity.strategy || 'Main Wallet'} • {new Date(activity.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`font-bold ${activity.amount > 0 ? 'text-emerald-400' : 'text-main'}`}>
                      {formatCurrency(activity.amount, true)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Profit Calculator */}
        <div className="bg-card border border-main rounded-3xl p-6 sm:p-8 pb-12 mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-display font-bold flex items-center text-main">
                <Calculator className="w-6 h-6 mr-2 text-emerald-500"/> 
                Profit Calculator
              </h3>
              <p className="text-muted text-sm mt-1">Project your potential earnings across different strategies.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(currency === 'INR' ? [10000, 50000, 100000, 500000, 1000000, 2500000] : [100, 500, 1000, 5000, 10000, 25000]).map((amount) => {
                const isSelected = currency === 'INR' 
                  ? Math.abs(Math.round(calcAmount * (rates['INR'] || 83)) - amount) < 10
                  : Math.abs(calcAmount - amount) < 0.1;
                
                return (
                  <button
                    key={amount}
                    onClick={() => {
                      if (currency === 'INR') {
                        setCalcAmount(amount / (rates['INR'] || 83));
                      } else {
                        setCalcAmount(amount);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'bg-emerald-500 text-black border-emerald-500' 
                        : 'bg-muted text-muted border-main hover:border-main/20'
                    }`}
                  >
                    {currency === 'INR' 
                      ? amount >= 100000 ? `${amount / 100000}L` : `${amount / 1000}k`
                      : `$${amount.toLocaleString()}`}
                  </button>
                );
              })}
            </div>
          </div>
 
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 space-y-6">
              <div className="bg-card border border-main rounded-2xl p-6">
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-3">Investment Amount ({currency})</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={isNaN(calcAmount * (rates[currency] || 1)) ? 0 : Math.round(calcAmount * (rates[currency] || 1) * 100) / 100}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const rate = rates[currency] || 1;
                      setCalcAmount(val / rate);
                    }}
                    className="w-full bg-muted border border-main rounded-xl px-4 py-4 text-2xl font-bold text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold">
                    {currency}
                  </div>
                </div>
                <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <Info className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <p className="text-xs text-muted leading-relaxed">
                      Calculations are based on current strategy performance and historical data. Past performance does not guarantee future results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {activeStrategies.map((s, i) => {
                const dReturn = typeof s.daily_return === 'string' ? parseFloat(s.daily_return) : s.daily_return;
                const wReturn = typeof s.weekly_return === 'string' ? parseFloat(s.weekly_return) : s.weekly_return;
                const mReturn = typeof s.monthly_return === 'string' ? parseFloat(s.monthly_return) : s.monthly_return;

                const dailyProfit = calcAmount * (dReturn / 100);
                const weeklyProfit = calcAmount * (wReturn / 100);
                const monthlyProfit = calcAmount * (mReturn / 100);
                const growthPercent = ((monthlyProfit / calcAmount) * 100).toFixed(2);
                
                return (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-card border border-main rounded-3xl p-6 flex flex-col relative group transition-all hover:border-emerald-500/40 hover:shadow-glow-emerald"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] mb-1">{s.type || 'Strategy'}</p>
                        <h4 className="text-lg font-display font-bold text-main leading-tight group-hover:text-emerald-400 transition-colors">{s.name}</h4>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-right shadow-glow-emerald">
                        <p className="text-xs font-bold text-emerald-500 leading-none">{s.apy}</p>
                        <p className="text-[8px] text-emerald-500/60 font-bold uppercase mt-1 tracking-widest">APY</p>
                      </div>
                    </div>
                    
                    {/* Returns Grid */}
                    <div className="space-y-5 flex-1">
                      <div className="flex justify-between items-end border-b border-main pb-3 group-hover:border-emerald-500/20 transition-colors">
                        <span className="text-[11px] text-muted font-bold uppercase tracking-widest">Daily</span>
                        <span className="text-base font-mono font-bold text-main">{formatCurrency(dailyProfit)}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-main pb-3 group-hover:border-emerald-500/20 transition-colors">
                        <span className="text-[11px] text-muted font-bold uppercase tracking-widest">Weekly</span>
                        <span className="text-base font-mono font-bold text-main">{formatCurrency(weeklyProfit)}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-main pb-3 group-hover:border-emerald-500/20 transition-colors">
                        <span className="text-[11px] text-muted font-bold uppercase tracking-widest">Monthly</span>
                        <span className="text-base font-mono font-bold text-emerald-400 text-glow-emerald">{formatCurrency(monthlyProfit)}</span>
                      </div>
                    </div>
                    
                    {/* Footer / Total */}
                    <div className="mt-8 pt-6 border-t border-main">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Est. Total Balance</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold shadow-glow-emerald">+{growthPercent}%</span>
                      </div>
                      <p className="text-2xl font-display font-bold text-main tracking-tight group-hover:text-emerald-400 transition-colors">
                        {formatCurrency(calcAmount + monthlyProfit)}
                      </p>
                    </div>

                    {/* Subtle Background Glow */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none"></div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-time Intelligence */}
        <div className="mt-12">
          <LiveMarket isDashboard={true} />
        </div>

      </div>
    </DashboardLayout>
  );
}
