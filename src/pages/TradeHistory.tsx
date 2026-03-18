import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Activity, TrendingUp, TrendingDown, Clock, Calendar, Filter, Download } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase } from '../supabaseClient';

interface Trade {
  id: string;
  asset: string;
  type: 'buy' | 'sell';
  entry_price: number;
  exit_price: number;
  amount: number;
  profit: number;
  status: 'open' | 'closed';
  open_time: string;
  close_time: string;
  strategy: string;
}

export default function TradeHistory({ session }: { session: any }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    async function fetchTrades() {
      try {
        // Fetch trade logs from support_messages where sender is 'system_trade_log'
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('sender', 'system_trade_log')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const parsedTrades = data.map(msg => {
            try {
              return JSON.parse(msg.text);
            } catch (e) {
              return null;
            }
          }).filter(t => t !== null);
          setTrades(parsedTrades);
        }
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrades();
  }, [session.user.id]);

  return (
    <DashboardLayout session={session}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-main">History of Trades</h2>
            <p className="text-muted mt-2">Detailed log of all executed trades and their performance.</p>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button className="bg-muted hover:bg-border-main text-main text-sm font-medium py-2 px-4 rounded-lg border border-main transition-all flex items-center space-x-2 flex-1 sm:flex-none justify-center">
              <Download className="w-4 h-4" />
              <span>Export History</span>
            </button>
          </div>
        </div>

        <div className="bg-card border border-main rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-main text-muted text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Asset / Strategy</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold text-right">Entry Price</th>
                  <th className="px-6 py-4 font-bold text-right">Exit Price</th>
                  <th className="px-6 py-4 font-bold text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-right">Profit/Loss</th>
                  <th className="px-6 py-4 font-bold text-right">Time Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted">Loading trade history...</p>
                    </td>
                  </tr>
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted">
                      No trades executed yet.
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-muted transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trade.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-main">{trade.asset}</p>
                            <p className="text-xs text-muted">{trade.strategy}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          trade.type === 'buy' ? 'text-blue-400 bg-blue-400/10' : 'text-orange-400 bg-orange-400/10'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-main">
                        {formatCurrency(trade.entry_price)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-main">
                        {formatCurrency(trade.exit_price)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-main">
                        {trade.amount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`flex flex-col items-end`}>
                          <span className={`font-bold text-sm ${trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trade.profit >= 0 ? '+' : ''}{formatCurrency(trade.profit)}
                          </span>
                          <span className={`text-[10px] ${trade.profit >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                            {((trade.profit / (trade.entry_price * trade.amount)) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center text-[10px] text-muted">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Open: {new Date(trade.open_time).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center text-[10px] text-muted">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Close: {new Date(trade.close_time).toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
