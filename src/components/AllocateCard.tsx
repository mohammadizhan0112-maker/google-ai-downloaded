import React, { useState, useEffect } from 'react';
import { ChevronDown, Info, ArrowRightLeft } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase } from '../supabaseClient';

const availableStrategies = [
  { id: 'steady', name: 'Steady Yield Engine', apy: 10.25, risk: 'Low' },
  { id: 'momentum', name: 'Crypto Momentum', apy: 20.0, risk: 'Medium' },
  { id: 'alpha', name: 'Commodity Alpha', apy: 35.0, risk: 'High' },
];

export default function AllocateCard({ balance = 0 }: { balance?: number }) {
  const { formatCurrency, currency } = useCurrency();
  const [mode, setMode] = useState<'allocate' | 'withdraw'>('allocate');
  const [amount, setAmount] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(0);
  const [isStrategyDropdownOpen, setIsStrategyDropdownOpen] = useState(false);

  const [strategies, setStrategies] = useState<any[]>(availableStrategies);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(availableStrategies[0]);

  useEffect(() => {
    const fetchSettingsAndLogs = async () => {
      try {
        // Fetch dynamic strategies
        const { data: settingsData, error: settingsError } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_strategies')
          .order('created_at', { ascending: false })
          .limit(1);

        let currentStrategies = [...availableStrategies];
        if (!settingsError && settingsData && settingsData.length > 0) {
          const parsedStrats = JSON.parse(settingsData[0].text);
          if (parsedStrats && parsedStrats.length > 0) {
            currentStrategies = parsedStrats.map((s: any) => ({
              id: s.id,
              name: s.name,
              apy: parseFloat(s.apy) || 0,
              risk: s.risk,
              color: s.color
            }));
          }
        }

        // Fetch trade logs
        const { data: logsData, error: logsError } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'trade_log');

        if (!logsError && logsData && logsData.length > 0) {
          const strategyStats: Record<string, { margin: number, profit: number }> = {};
          currentStrategies.forEach(s => { strategyStats[s.id] = { margin: 0, profit: 0 }; });

          logsData.forEach(log => {
            try {
              const logData = JSON.parse(log.text);
              if (strategyStats[logData.strategyId]) {
                strategyStats[logData.strategyId].margin += Number(logData.margin);
                strategyStats[logData.strategyId].profit += Number(logData.profit);
              }
            } catch (e) {}
          });

          currentStrategies = currentStrategies.map(strat => {
            const stats = strategyStats[strat.id];
            if (stats && stats.margin > 0) {
              const rawReturn = (stats.profit / stats.margin) * 100;
              return { ...strat, apy: Math.max(strat.apy, parseFloat(rawReturn.toFixed(2))) };
            }
            return strat;
          });
        }

        setStrategies(currentStrategies);
        setSelectedStrategy(currentStrategies[0]);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchSettingsAndLogs();
  }, []);

  const assetIcon = currency === 'USD' ? '💵' : currency === 'EUR' ? '💶' : '💷';

  // Update amount when percentage changes
  useEffect(() => {
    if (percentage > 0) {
      const calculatedAmount = (balance * (percentage / 100)).toFixed(2);
      // Remove trailing zeros after decimal
      setAmount(parseFloat(calculatedAmount).toString());
    }
  }, [percentage, balance]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
      // Update percentage based on amount
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && balance > 0) {
        let newPct = (numVal / balance) * 100;
        if (newPct > 100) newPct = 100;
        setPercentage(newPct);
      } else {
        setPercentage(0);
      }
    }
  };

  const handleMax = () => {
    setPercentage(100);
    setAmount(balance.toString());
  };

  const estimatedYearlyYield = (parseFloat(amount || '0') * ((selectedStrategy?.apy || 0) / 100));
  const estimatedDailyYield = estimatedYearlyYield / 365;

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    const numAmount = parseFloat(amount);
    if (mode === 'allocate' && numAmount < 100) return;
    if (mode === 'allocate' && numAmount > balance) {
      alert('Insufficient balance');
      return;
    }

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const txType = mode === 'allocate' ? 'strategy_allocation' : 'strategy_withdrawal';
      
      // Call RPC to handle transaction and balance update atomically
      const { error: txError } = await supabase.rpc('process_allocation', {
        user_id: session.user.id,
        amount: numAmount,
        strategy: selectedStrategy.id,
        is_allocation: mode === 'allocate'
      });

      if (txError) throw txError;

      alert(`Successfully ${mode === 'allocate' ? 'allocated' : 'withdrawn'} ${numAmount} ${currency} ${mode === 'allocate' ? 'to' : 'from'} ${selectedStrategy.name}`);
      
      // Reset form
      setAmount('');
      setPercentage(0);
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error processing allocation:', error);
      alert('Failed to process request. Please try again.');
    }
  };

  return (
    <div className="bg-card border border-main rounded-3xl p-6 sm:p-8 w-full max-w-2xl mx-auto shadow-2xl relative">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0 relative z-10">
        <h2 className="text-2xl font-display font-bold text-main">Allocate Assets</h2>
        
        {/* Toggle */}
        <div className="flex bg-muted p-1 rounded-xl border border-main">
          <button 
            onClick={() => setMode('allocate')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'allocate' 
                ? 'bg-main text-main shadow-md border border-main' 
                : 'text-muted hover:text-main'
            }`}
          >
            Allocate
          </button>
          <button 
            onClick={() => setMode('withdraw')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'withdraw' 
                ? 'bg-main text-main shadow-md border border-main' 
                : 'text-muted hover:text-main'
            }`}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="mb-6 relative z-50">
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Select Strategy</label>
        <div className="relative">
          <button 
            onClick={() => setIsStrategyDropdownOpen(!isStrategyDropdownOpen)}
            className="w-full bg-muted border border-main hover:border-hover rounded-2xl p-4 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                selectedStrategy?.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                selectedStrategy?.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                'bg-orange-500/10 border-orange-500/20 text-orange-500'
              }`}>
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-main text-lg">{selectedStrategy?.name}</p>
                <p className="text-xs text-emerald-400 font-medium">{selectedStrategy?.apy}% APY • {selectedStrategy?.risk} Risk</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted transition-transform ${isStrategyDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStrategyDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-main rounded-2xl shadow-2xl overflow-hidden z-50">
              {strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => {
                    setSelectedStrategy(strategy);
                    setIsStrategyDropdownOpen(false);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-main/10 transition-colors border-b border-main last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      strategy.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                      strategy.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                      'bg-orange-500/10 border-orange-500/20 text-orange-500'
                    }`}>
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-main">{strategy.name}</p>
                      <p className="text-xs text-muted">{strategy.risk} Risk</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">{strategy.apy}% APY</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-muted border border-main rounded-2xl p-4 sm:p-6 mb-6 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">Amount</label>
          <span className="text-sm text-muted font-medium">
            Bal: {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <input 
            type="text" 
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="bg-transparent text-4xl sm:text-5xl font-display font-bold text-main w-full focus:outline-none placeholder-muted/30"
          />
          
          <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
            <button 
              onClick={handleMax}
              className="text-xs font-bold text-main bg-main/10 hover:bg-main/20 px-3 py-2 rounded-lg transition-colors border border-main"
            >
              MAX
            </button>
            
            <div className="flex items-center space-x-2 bg-main border border-main px-4 py-2 rounded-xl">
              <span className="text-base">{assetIcon}</span>
              <span className="font-bold text-main">{currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-8 relative z-10 px-2">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={percentage}
          onChange={(e) => setPercentage(Number(e.target.value))}
          className="w-full h-1.5 bg-main rounded-lg appearance-none cursor-pointer accent-main"
          style={{
            background: `linear-gradient(to right, var(--text-main) ${percentage}%, var(--bg-main) ${percentage}%)`
          }}
        />
        <div className="flex justify-between items-center mt-3 text-xs font-bold text-muted">
          <span className={percentage === 0 ? 'text-main' : ''}>0%</span>
          <span className={percentage === 25 ? 'text-main' : ''}>25%</span>
          <span className={percentage === 50 ? 'text-main' : ''}>50%</span>
          <span className={percentage === 75 ? 'text-main' : ''}>75%</span>
          <span className={percentage === 100 ? 'text-main' : ''}>100%</span>
        </div>
      </div>

      {/* Extra Features / Summary */}
      <div className="bg-muted/50 border border-main rounded-2xl p-4 mb-8 relative z-10 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted flex items-center">
            Estimated Daily Yield
            <Info className="w-3.5 h-3.5 ml-1.5 text-muted/50" />
          </span>
          <span className="text-emerald-400 font-bold">
            {amount ? `+${estimatedDailyYield.toFixed(4)} ${currency}` : '0.00'}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted flex items-center">
            Network Fee
            <Info className="w-3.5 h-3.5 ml-1.5 text-muted/50" />
          </span>
          <span className="text-main font-medium">~$2.50</span>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleConfirm}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all relative z-10 ${
          amount && parseFloat(amount) > 0 && (mode === 'withdraw' || parseFloat(amount) >= 100)
            ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-glow-emerald' 
            : 'bg-main text-muted cursor-not-allowed border border-main'
        }`}
        disabled={!amount || parseFloat(amount) <= 0 || (mode === 'allocate' && parseFloat(amount) < 100)}
      >
        {mode === 'allocate' && amount && parseFloat(amount) > 0 && parseFloat(amount) < 100 
          ? 'Minimum $100 Required' 
          : `Confirm ${mode === 'allocate' ? 'Allocation' : 'Withdrawal'}`}
      </button>
    </div>
  );
}
