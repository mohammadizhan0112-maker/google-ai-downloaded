import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, CreditCard, Filter, Download } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase } from '../supabaseClient';

interface Transaction {
  id: string;
  type: string;
  strategy: string;
  amount: number;
  created_at: string;
  status: string;
  currency?: string;
  network?: string;
  address?: string;
  fee?: number;
}

export default function History({ session }: { session: any }) {
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          // Fallback if table doesn't exist yet
          console.error('Error fetching transactions:', error);
          setTransactions([]);
        } else {
          setTransactions(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [session.user.id]);

  const filteredActivity = filter === 'all' 
    ? transactions 
    : filter === 'allocation'
      ? transactions.filter(a => a.type === 'strategy_allocation' || a.type === 'strategy_withdrawal')
      : transactions.filter(a => a.type === filter);

  return (
    <DashboardLayout session={session}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-main">Transaction History</h2>
            <p className="text-muted mt-2">View all your deposits, withdrawals, allocations, and yields.</p>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button className="bg-muted hover:bg-border-main text-main text-sm font-medium py-2 px-4 rounded-lg border border-main transition-all flex items-center space-x-2 flex-1 sm:flex-none justify-center shadow-sm">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button className="bg-muted hover:bg-border-main text-main text-sm font-medium py-2 px-4 rounded-lg border border-main transition-all flex items-center space-x-2 flex-1 sm:flex-none justify-center shadow-sm">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="bg-card border border-main rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 custom-scrollbar">
            {['all', 'deposit', 'withdrawal', 'yield', 'allocation'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${
                  filter === f 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-muted text-muted hover:text-main hover:bg-border-main border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted">Loading transactions...</p>
              </div>
            ) : filteredActivity.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted">{transactions.length === 0 ? 'No History' : 'No transactions found for this filter.'}</p>
              </div>
            ) : (
              filteredActivity.map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-muted border border-main hover:bg-border-main transition-colors cursor-pointer gap-4 sm:gap-0">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'yield' ? 'bg-emerald-500/10 text-emerald-500' :
                      activity.type === 'deposit' ? 'bg-blue-500/10 text-blue-500' :
                      activity.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {activity.type === 'yield' ? <TrendingUp className="w-6 h-6" /> :
                       activity.type === 'deposit' ? <ArrowDownRight className="w-6 h-6" /> :
                       activity.type === 'withdrawal' ? <ArrowUpRight className="w-6 h-6" /> :
                       <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-main capitalize text-lg">{activity.type}</p>
                      <p className="text-sm text-muted">
                        {activity.strategy || 'Main Wallet'} • {new Date(activity.created_at).toLocaleDateString()}
                        {activity.address && (
                          <span className="block text-xs font-mono mt-1 opacity-70">
                            {activity.currency || activity.strategy} {activity.network ? `(${activity.network})` : ''}: {activity.address}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                    <div className={`font-bold text-lg ${activity.amount > 0 ? 'text-emerald-500' : 'text-main'}`}>
                      {formatCurrency(activity.amount, true)}
                      {activity.fee && activity.fee > 0 && (
                        <span className="block text-[10px] text-muted font-normal mt-0.5">
                          Fee: {formatCurrency(activity.fee, true)}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md mt-0 sm:mt-1 ${
                      activity.status === 'completed' ? 'text-emerald-500 bg-emerald-500/10' :
                      activity.status === 'pending' ? 'text-orange-500 bg-orange-500/10' :
                      'text-red-500 bg-red-500/10'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
