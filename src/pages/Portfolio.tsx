import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { BTCLogo, ETHLogo, SOLLogo, USDCLogo } from '../components/CryptoLogos';
import { supabase } from '../supabaseClient';

export default function Portfolio({ session }: { session: any }) {
  const { formatCurrency } = useCurrency();
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [totalYield, setTotalYield] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [depositedAssets, setDepositedAssets] = useState<any[]>([]);

  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch trade logs
        const { data: tradeLogs } = await supabase
          .from('support_messages')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('sender', 'system_trade_log');

        if (tradeLogs) {
          const parsedTrades = tradeLogs.map(msg => {
            try {
              return JSON.parse(msg.text);
            } catch (e) {
              return null;
            }
          }).filter(t => t !== null);
          setTrades(parsedTrades);
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('available_balance, allocated_balance')
          .eq('id', session.user.id)
          .single();

        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!txError && txData) {
          let yieldEarned = 0;
          let allocatedAmount = 0;
          const assetBalances: Record<string, number> = {};
          
          txData.forEach(tx => {
            if (tx.status === 'completed') {
              if (tx.type === 'yield') {
                yieldEarned += Number(tx.amount);
                assetBalances['USDT'] = (assetBalances['USDT'] || 0) + Number(tx.amount);
              }
              if (tx.type === 'deposit') {
                let asset = tx.strategy || 'USDT';
                if (asset === 'admin_manual_funding' || asset === 'Yield Distribution' || asset === 'INR') {
                  asset = 'USDT';
                }
                assetBalances[asset] = (assetBalances[asset] || 0) + Number(tx.amount);
              }
              if (tx.type === 'withdrawal') {
                let asset = tx.currency || 'USDT';
                assetBalances[asset] = (assetBalances[asset] || 0) - Number(tx.amount);
              }
              if (tx.type === 'strategy_allocation') {
                allocatedAmount += Number(tx.amount);
              }
              if (tx.type === 'strategy_withdrawal') {
                allocatedAmount -= Number(tx.amount);
              }
            }
          });
          
          setPortfolioValue((profileData?.available_balance || 0) + (profileData?.allocated_balance || 0));
          setTotalYield(yieldEarned);

          const assetsList = Object.keys(assetBalances)
            .filter(asset => assetBalances[asset] > 0)
            .map(asset => {
            let Logo = USDCLogo;
            if (asset === 'BTC') Logo = BTCLogo;
            if (asset === 'ETH') Logo = ETHLogo;
            if (asset === 'SOL') Logo = SOLLogo;
            
            return {
              name: asset === 'USDT' ? 'Tether' : asset === 'BTC' ? 'Bitcoin' : asset === 'ETH' ? 'Ethereum' : asset === 'SOL' ? 'Solana' : asset,
              symbol: asset,
              balance: assetBalances[asset].toFixed(2),
              value: assetBalances[asset],
              change: yieldEarned > 0 ? '+1.2%' : '0.0%',
              isPositive: yieldEarned >= 0,
              Logo
            };
          });

          if (assetsList.length === 0) {
            assetsList.push({
              name: 'Tether', symbol: 'USDT', balance: '0.00', value: 0, change: '0.0%', isPositive: true, Logo: USDCLogo
            });
          }

          setDepositedAssets(assetsList);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session.user.id]);

  const portfolioData = depositedAssets.map((asset, index) => ({
    name: asset.symbol,
    value: asset.value > 0 ? asset.value : 1,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 4]
  }));

  const wins = trades.filter(t => t.profit > 0).length;
  const winRate = trades.length > 0 ? `${((wins / trades.length) * 100).toFixed(1)}%` : '0%';
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit > 0 ? t.profit : 0), 0);
  const totalLoss = Math.abs(trades.reduce((sum, t) => sum + (t.profit < 0 ? t.profit : 0), 0));
  const profitFactor = totalLoss === 0 ? (totalProfit > 0 ? 'MAX' : '0.00') : (totalProfit / totalLoss).toFixed(2);
  const maxDrawdown = trades.length > 0 ? '4.2%' : '0%';
  const activeTrades = trades.filter(t => t.status === 'open').length.toString();

  return (
    <DashboardLayout session={session}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* AI Trading Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-main rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wider">Win Rate</p>
            <p className="text-3xl font-bold text-emerald-500">{winRate}</p>
          </div>
          <div className="bg-card border border-main rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wider">Profit Factor</p>
            <p className="text-3xl font-bold text-blue-500">{profitFactor}</p>
          </div>
          <div className="bg-card border border-main rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wider">Max Drawdown</p>
            <p className="text-3xl font-bold text-orange-500">{maxDrawdown}</p>
          </div>
          <div className="bg-card border border-main rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wider">Active Trades</p>
            <p className="text-3xl font-bold text-main">{activeTrades}</p>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-card border border-main rounded-3xl p-8 flex flex-col justify-center items-center relative overflow-hidden shadow-xl">
            <h3 className="text-xl font-display font-bold mb-6 self-start w-full text-main">Asset Allocation</h3>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', borderRadius: '12px', color: 'var(--text-main)' }}
                    itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                    formatter={(value: number) => [formatCurrency(value), 'Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-muted text-xs font-medium">Total Balance</span>
                <span className="text-xl font-bold text-main">{loading ? formatCurrency(0) : formatCurrency(portfolioValue)}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-card border border-main rounded-3xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-main">Your Assets</h3>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-main text-muted text-sm">
                    <th className="pb-4 font-medium">Asset</th>
                    <th className="pb-4 font-medium text-right">Balance</th>
                    <th className="pb-4 font-medium text-right">Value</th>
                    <th className="pb-4 font-medium text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {depositedAssets.map((asset, index) => (
                    <tr key={index} className="border-b border-main hover:bg-muted transition-colors group cursor-pointer">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <asset.Logo className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-bold text-main">{asset.name}</p>
                            <p className="text-xs text-muted">{asset.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <p className="font-medium text-main">{asset.balance}</p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="font-medium text-main">{formatCurrency(asset.value)}</p>
                      </td>
                      <td className="py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                          asset.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {asset.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
                          {asset.change}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
