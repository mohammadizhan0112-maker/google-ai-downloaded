import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import AdminContent from '../components/AdminContent';
import { 
  Users, ArrowDownRight, ArrowUpRight, FileText, 
  Settings, CheckCircle2, XCircle, Search, Bell, 
  TrendingUp, RefreshCw, Filter, ChevronRight, ArrowLeft,
  User, Mail, Phone, MapPin, Calendar, Clock, LayoutDashboard, Activity, Headset, Sparkles, ShieldCheck, CreditCard, Building, Wallet,
  ArrowDownCircle, ArrowUpCircle, History, MessageSquare
} from 'lucide-react';
import { generateTradeLog } from '../services/geminiService';

export default function AdminDashboard({ session }: { session: any }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentAudit, setPaymentAudit] = useState<any[]>([]);
  
  // State for data
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tradeLogs, setTradeLogs] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>({ 
    upiId: 'eldetrades@upi', 
    upiQr: '', 
    minDeposit: 100,
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankBranch: ''
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Strategies & Yields state
  const [strategies, setStrategies] = useState<any[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<any[]>([]);
  const [newPerformance, setNewPerformance] = useState({
    strategyId: '',
    date: new Date().toISOString().split('T')[0],
    returnPercent: ''
  });
  const [conversionRates, setConversionRates] = useState<any>({
    USDT: 1,
    BTC: 65000,
    ETH: 3500,
    SOL: 150,
    INR: 0.012, // 1 INR = 0.012 USD
    GBP: 1.25,
    EUR: 1.08,
    depositRates: { INR: 95.05, GBP: 0.8, EUR: 0.9 },
    withdrawalRates: { INR: 83, GBP: 0.82, EUR: 0.92 },
    bankTiers: [
      { min: 10000, rate: 92.55 },
      { min: 5000, rate: 93.67 },
      { min: 1000, rate: 94.43 },
      { min: 1, rate: 95.05 }
    ],
    upiTiers: [
      { min: 1000, rate: 94.43 },
      { min: 1, rate: 95.05 }
    ],
    minDepositUSD: 100
  });
  
  // Notification state
  const [notificationMsg, setNotificationMsg] = useState('');
  const [notificationTarget, setNotificationTarget] = useState('all'); // 'all' or user ID
  const [updateTarget, setUpdateTarget] = useState('all'); // 'all' or 'selected'
  
  // List of authorized admin emails
  const ADMIN_EMAILS = ['kffatima44@gmail.com', 'mohammadizhan0112@gmail.com', 'wajiuddin65@gmail.com'];

  const [searchQuery, setSearchQuery] = useState('');

  const [isGeneratingTrade, setIsGeneratingTrade] = useState(false);

  const handleAiGenerateTrade = async () => {
    setIsGeneratingTrade(true);
    try {
      const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      if (!randomStrategy) return;
      
      const trade = await generateTradeLog(randomStrategy.name);
      if (trade) {
        // Fill the form or just submit directly
        const form = document.querySelector('form[data-trade-form]') as HTMLFormElement;
        if (form) {
          (form.elements.namedItem('strategy') as HTMLSelectElement).value = randomStrategy.id;
          (form.elements.namedItem('asset') as HTMLInputElement).value = trade.asset;
          (form.elements.namedItem('margin') as HTMLInputElement).value = trade.margin.toString();
          (form.elements.namedItem('profit') as HTMLInputElement).value = trade.profit.toString();
          (form.elements.namedItem('isWin') as HTMLSelectElement).value = trade.isWin ? 'true' : 'false';
          (form.elements.namedItem('details') as HTMLTextAreaElement).value = trade.details;
        }
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
    } finally {
      setIsGeneratingTrade(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          setIsAdmin(true);
          fetchData();
        } else {
          // Redirect non-admins to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/dashboard');
      } finally {
        setAuthChecking(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users (profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      setUsers(profilesData || []);

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (txError) throw txError;
      setTransactions(txData || []);
      
      // Fetch documents and support messages
      const { data: supportData, error: supportError } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!supportError && supportData) {
        setDocuments(supportData.filter(msg => msg.status === 'document_pending' || msg.text.startsWith('DOCUMENT_UPLOAD:')));
        setPaymentAudit(supportData.filter(msg => msg.text.startsWith('PAYMENT_METHOD_')));
        setTradeLogs(supportData.filter(msg => msg.sender === 'trade_log' || msg.sender === 'system_trade_log'));
        setSupportTickets(supportData.filter(msg => 
          msg.status !== 'document_pending' && 
          msg.sender !== 'trade_log' && 
          msg.sender !== 'system_settings'
        ));
        
        const settingsMsg = supportData.find(msg => msg.sender === 'system_settings');
        if (settingsMsg) {
          try {
            const parsed = JSON.parse(settingsMsg.text);
            setGlobalSettings((prev: any) => ({ ...prev, ...parsed }));
          } catch (e) {}
        }
      }
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      // Fetch strategies for yield distribution
      const { data: settingsData, error: settingsError } = await supabase
        .from('support_messages')
        .select('text')
        .eq('sender', 'system_settings_strategies')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!settingsError && settingsData && settingsData.length > 0) {
        const parsedStrats = JSON.parse(settingsData[0].text);
        if (parsedStrats && parsedStrats.length > 0) {
          setStrategies(parsedStrats.map((s: any) => ({
            id: s.id,
            name: s.name,
            apy: parseFloat(s.apy) || 0,
            risk: s.risk || 'Medium',
            color: s.color || 'emerald',
            daily_return: s.daily_return ?? (parseFloat(s.apy) / 365).toFixed(2),
            weekly_return: s.weekly_return ?? (parseFloat(s.apy) / 52).toFixed(2),
            monthly_return: s.monthly_return ?? (parseFloat(s.apy) / 12).toFixed(2),
            profit: 0
          })));
        }
      }

      // Fetch performance logs
      const { data: perfData, error: perfError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('sender', 'strategy_performance_log')
        .order('created_at', { ascending: false });
      
      if (!perfError && perfData) {
        setPerformanceLogs(perfData.map(log => ({
          id: log.id,
          created_at: log.created_at,
          ...JSON.parse(log.text)
        })));
      }

      // Fetch conversion rates
      const { data: conversionData, error: conversionError } = await supabase
        .from('support_messages')
        .select('text')
        .eq('sender', 'system_settings_conversion')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!conversionError && conversionData && conversionData.length > 0) {
        try {
          const parsedRates = JSON.parse(conversionData[0].text);
          if (parsedRates && typeof parsedRates === 'object') {
            setConversionRates(prev => {
              const merged = { ...prev, ...parsedRates };
              // Ensure tiers are not lost if they were missing in the DB record
              if (!merged.bankTiers || merged.bankTiers.length === 0) {
                merged.bankTiers = prev.bankTiers;
              }
              if (!merged.upiTiers || merged.upiTiers.length === 0) {
                merged.upiTiers = prev.upiTiers;
              }
              return merged;
            });
          }
        } catch (e) {
          console.error('Error parsing conversion rates:', e);
        }
      }

      setLoading(false);
    }
  };

  const handleApproveTransaction = async (id: string, type: string, amount?: number, userId?: string, strategy?: string) => {
    try {
      if (type === 'deposit') {
        const depositRate = conversionRates.depositRates?.INR || (1 / (conversionRates.INR || 0.012));
        const defaultAmount = strategy === 'INR' ? (amount ? (amount / depositRate).toFixed(2) : '') : (amount || '');
        const inputAmount = prompt(`Enter the confirmed deposit amount in USD:\n(Original request: ${amount} ${strategy === 'INR' ? 'INR' : 'USD'})`, defaultAmount.toString());
        
        if (!inputAmount || isNaN(Number(inputAmount))) {
          alert('Invalid amount. Approval cancelled.');
          return;
        }
        
        const finalAmount = Number(inputAmount);
        const newStrategy = (strategy === 'INR' || strategy === 'BANK') ? 'USDT' : strategy;

        // Call the RPC function
        const { data, error } = await supabase.rpc('approve_deposit', { 
          tx_id: id,
          final_amount: finalAmount,
          new_strategy: newStrategy
        });

        console.log("RPC RESULT:", { data, error });

        if (error) {
          console.error('Error approving deposit:', error);
          alert(`Error: ${error.message}`);
          return;
        }

        if (data === false) {
          alert('Failed to approve: Transaction not found or already processed.');
          return;
        }
        
        // Update local state
        setTransactions(prev => prev.map(tx => 
          tx.id === id ? { 
            ...tx, 
            status: 'completed', 
            amount: finalAmount,
            strategy: newStrategy,
            approved_at: new Date().toISOString()
          } : tx
        ));
        
        // Update user balance locally
        if (userId) {
          setUsers(prev => prev.map(u => {
            if (u.id === userId) {
              return { ...u, available_balance: (Number(u.available_balance) || 0) + finalAmount };
            }
            // Check if this user is the referrer
            const userBeingApproved = users.find(user => user.id === userId);
            if (userBeingApproved?.referred_by === u.id) {
              return { ...u, referral_balance: (Number(u.referral_balance) || 0) + (finalAmount * 0.01) };
            }
            return u;
          }));
        }
        
        alert('Deposit approved successfully');
      } else if (type === 'withdrawal') {
        const { data, error } = await supabase.rpc('approve_withdrawal', {
          withdrawal_id: id
        });

        if (error) {
          console.error('Error approving withdrawal:', error);
          alert(`Error: ${error.message}`);
          return;
        }

        if (data === false) {
          alert('Failed to approve: Withdrawal not found or already processed.');
          return;
        }

        setTransactions(prev => prev.map(tx => 
          tx.id === id ? { ...tx, status: 'completed', approved_at: new Date().toISOString() } : tx
        ));
        
        alert('Withdrawal approved successfully');
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      alert('Failed to approve transaction');
    }
  };

  const handleRejectTransaction = async (id: string, type: string, amount?: number, userId?: string) => {
    const reason = prompt('Enter reason for rejection:');
    if (reason === null) return;
    
    try {
      if (type === 'deposit') {
        const { data, error } = await supabase.rpc('reject_deposit', {
          deposit_id: id,
          reject_reason: `Your deposit request of $${amount?.toLocaleString() || '0'} has been rejected. Reason: ${reason}`
        });

        if (error) {
          console.error('Error rejecting deposit:', error);
          alert(`Error: ${error.message}`);
          return;
        }

        if (data === false) {
          alert('Failed to reject: Deposit not found or already processed.');
          return;
        }

        // Update local state
        setTransactions(prev => prev.map(tx => 
          tx.id === id ? { ...tx, status: 'rejected', notes: reason, approved_at: new Date().toISOString() } : tx
        ));
        
        alert('Deposit rejected');
      } else if (type === 'withdrawal') {
        const tx = transactions.find(t => t.id === id);
        const fee = tx?.fee || 0;
        const totalRefund = (amount || 0) + fee;

        const { data, error } = await supabase.rpc('reject_withdrawal', {
          withdrawal_id: id,
          reject_reason: `Your withdrawal request of $${amount?.toLocaleString() || '0'} has been rejected. Reason: ${reason}`
        });

        if (error) {
          console.error('Error rejecting withdrawal:', error);
          alert(`Error: ${error.message}`);
          return;
        }

        if (data === false) {
          alert('Failed to reject: Withdrawal not found or already processed.');
          return;
        }

        // Update local users state (refund balance)
        if (userId && totalRefund) {
          setUsers(prev => prev.map(u => u.id === userId ? { 
            ...u, 
            available_balance: (Number(u.available_balance) || 0) + totalRefund 
          } : u));
        }
        
        // Update local state
        setTransactions(prev => prev.map(tx => 
          tx.id === id ? { ...tx, status: 'rejected', notes: reason, approved_at: new Date().toISOString() } : tx
        ));
        
        alert('Withdrawal rejected');
      } else {
        const { error } = await supabase.rpc('reject_transaction', {
          tx_id: id,
          reason: reason
        });

        if (error) {
          console.error('Error rejecting transaction:', error);
          alert(`Error: ${error.message}`);
          return;
        }
        
        // Send notification to user
        if (userId) {
          await supabase.from('support_messages').insert([{
            user_id: userId,
            text: `Your ${type} request of $${amount?.toLocaleString() || '0'} has been rejected. Reason: ${reason}`,
            sender: 'admin',
            status: 'unread'
          }]);
        }
        
        // Update local state
        setTransactions(prev => prev.map(tx => 
          tx.id === id ? { ...tx, status: 'rejected', notes: reason, approved_at: new Date().toISOString() } : tx
        ));
        
        alert('Transaction rejected');
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      alert('Failed to reject transaction');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationMsg) return;
    
    try {
      if (notificationTarget === 'all') {
        // Send to all users
        const messages = users.map(user => ({
          user_id: user.id,
          text: notificationMsg,
          sender: 'admin'
        }));
        
        const { error } = await supabase.from('support_messages').insert(messages);
        if (error) throw error;
      } else {
        // Send to selected user
        const { error } = await supabase.from('support_messages').insert([{
          user_id: notificationTarget,
          text: notificationMsg,
          sender: 'admin'
        }]);
        if (error) throw error;
      }
      
      alert(`Notification sent to ${notificationTarget === 'all' ? 'all users' : 'selected user'}`);
      setNotificationMsg('');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  const handleUpdateStrategies = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save updated strategies to system_settings_strategies
      const updatedStrats = strategies.map(s => ({
        id: s.id,
        name: s.name,
        apy: s.apy.toString().includes('%') ? s.apy : s.apy.toString() + '%',
        risk: s.risk,
        color: s.color,
        daily_return: Number(s.daily_return),
        weekly_return: Number(s.weekly_return),
        monthly_return: Number(s.monthly_return)
      }));

      await supabase.from('support_messages').delete().eq('sender', 'system_settings_strategies');
      await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: JSON.stringify(updatedStrats),
        sender: 'system_settings_strategies',
        status: 'completed'
      }]);

      // Save conversion rates
      await supabase.from('support_messages').delete().eq('sender', 'system_settings_conversion');
      const { error: ratesError } = await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: JSON.stringify(conversionRates),
        sender: 'system_settings_conversion',
        status: 'completed'
      }]);

      if (ratesError) throw ratesError;

      alert('Strategies and conversion rates updated successfully.');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating strategies:', error);
      alert('Failed to update strategies');
    }
  };

  const handleLogPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerformance.strategyId || !newPerformance.returnPercent) return;

    setLoading(true);
    try {
      const returnPct = parseFloat(newPerformance.returnPercent);
      
      // 1. Log the performance event
      const { error: logError } = await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: JSON.stringify({
          strategyId: newPerformance.strategyId,
          date: newPerformance.date,
          returnPercent: returnPct
        }),
        sender: 'strategy_performance_log',
        status: 'completed'
      }]);

      if (logError) throw logError;

      // 2. Distribute yield to users with active allocations
      // First, calculate current allocations for all users
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'completed')
        .eq('strategy', newPerformance.strategyId);

      if (txError) throw txError;

      const userAllocations: Record<string, number> = {};
      txData.forEach(tx => {
        if (tx.type === 'strategy_allocation') {
          userAllocations[tx.user_id] = (userAllocations[tx.user_id] || 0) + Number(tx.amount);
        } else if (tx.type === 'strategy_withdrawal') {
          userAllocations[tx.user_id] = (userAllocations[tx.user_id] || 0) - Number(tx.amount);
        }
      });

      const yieldTxs = [];
      const profileUpdates = [];

      for (const [userId, amount] of Object.entries(userAllocations)) {
        if (amount > 0) {
          const yieldAmount = amount * (returnPct / 100);
          if (yieldAmount > 0) {
            yieldTxs.push({
              user_id: userId,
              type: 'yield',
              amount: yieldAmount,
              status: 'completed',
              strategy: newPerformance.strategyId
            });
          }
        }
      }

      if (yieldTxs.length > 0) {
        for (const tx of yieldTxs) {
          const { error } = await supabase.rpc('process_allocation', {
            user_id: tx.user_id,
            amount: tx.amount,
            strategy: tx.strategy,
            is_allocation: false,
            tx_type: 'yield'
          });
          if (error) throw error;
        }
      }

      alert(`Performance logged and yield distributed to ${yieldTxs.length} users.`);
      setNewPerformance({ ...newPerformance, returnPercent: '' });
      fetchData();
    } catch (error) {
      console.error('Error logging performance:', error);
      alert('Failed to log performance');
    } finally {
      setLoading(false);
    }
  };

  const renderPayments = () => {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-main rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-main mb-6">Payment Methods Audit</h3>
          <p className="text-muted mb-6">View all saved and deleted payment methods for auditing purposes.</p>
          
          <div className="space-y-4">
            {paymentAudit.length === 0 ? (
              <div className="text-center py-12 text-muted border-2 border-dashed border-main rounded-xl">
                No payment method updates found.
              </div>
            ) : (
              paymentAudit.slice(0, 5).map((log) => {
                const parts = log.text.split(':');
                const action = parts[0]; // UPDATE or DELETE
                const type = parts[1]; // BANK or CRYPTO
                let data: any = {};
                try {
                  data = JSON.parse(parts.slice(2).join(':'));
                } catch (e) {
                  console.error('Error parsing payment audit data:', e);
                }
                const user = users.find(u => u.id === log.user_id);

                return (
                  <div key={log.id} className="bg-main border border-main rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.includes('DELETE') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {type === 'BANK' ? <Building className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-main font-bold">{user?.full_name || 'Unknown User'}</p>
                          <p className="text-xs text-muted">{user?.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        action.includes('DELETE') ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
                      }`}>
                        {action.replace('PAYMENT_METHOD_', '')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {type === 'BANK' ? (
                        Array.isArray(data) ? (
                          data.map((acc: any, i: number) => (
                            <div key={i} className="bg-main/50 p-2 rounded border border-main/20">
                              <p className="text-muted text-xs">Bank: <span className="text-main">{acc.bankName}</span></p>
                              <p className="text-muted text-xs">Acc: <span className="text-main">{acc.accountNumber}</span></p>
                            </div>
                          ))
                        ) : (
                          <div className="bg-main/50 p-2 rounded border border-main/20 col-span-2">
                            <p className="text-muted text-xs">Bank: <span className="text-main">{data.bankName}</span></p>
                            <p className="text-muted text-xs">Acc: <span className="text-main">{data.accountNumber}</span></p>
                          </div>
                        )
                      ) : (
                        Array.isArray(data) ? (
                          data.map((w: any, i: number) => (
                            <div key={i} className="bg-main/50 p-2 rounded border border-main/20">
                              <p className="text-muted text-xs">Net: <span className="text-main">{w.network}</span></p>
                              <p className="text-muted text-xs">Addr: <span className="text-main break-all">{w.address}</span></p>
                            </div>
                          ))
                        ) : (
                          <div className="bg-main/50 p-2 rounded border border-main/20 col-span-2">
                            <p className="text-muted text-xs">Net: <span className="text-main">{data.network}</span></p>
                            <p className="text-muted text-xs">Addr: <span className="text-main break-all">{data.address}</span></p>
                          </div>
                        )
                      )}
                    </div>
                    <div className="mt-3 text-[10px] text-muted text-right">
                      Logged at: {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card border border-main rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-main mb-6">Full Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-main text-sm text-muted">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paymentAudit.map((log) => {
                  const parts = log.text.split(':');
                  const action = parts[0];
                  const type = parts[1];
                  const user = users.find(u => u.id === log.user_id);
                  return (
                    <tr key={log.id} className="border-b border-main hover:bg-main/10">
                      <td className="py-4 text-muted">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="py-4 text-main">{user?.full_name || 'Unknown'}</td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                          action.includes('DELETE') ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
                        }`}>
                          {action.replace('PAYMENT_METHOD_', '')}
                        </span>
                      </td>
                      <td className="py-4 text-main font-medium">{type}</td>
                      <td className="py-4 text-muted text-xs">
                        {log.text.length > 50 ? log.text.substring(0, 50) + '...' : log.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    const pendingDeposits = transactions.filter(tx => tx.type === 'deposit' && tx.status === 'pending');
    const pendingWithdrawals = transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending');
    const totalVolume = transactions.filter(tx => tx.status === 'completed').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-main rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted font-medium">Total Users</h3>
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-main">{users.length}</p>
          </div>
          <div className="bg-card border border-main rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted font-medium">Pending Deposits</h3>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-main">{pendingDeposits.length}</p>
          </div>
          <div className="bg-card border border-main rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted font-medium">Pending Withdrawals</h3>
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-main">{pendingWithdrawals.length}</p>
          </div>
          <div className="bg-card border border-main rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted font-medium">Total Volume</h3>
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-main">${totalVolume.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-main rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-main mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-main/50 rounded-xl border border-main/20">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' :
                    tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {tx.type === 'deposit' ? <ArrowDownRight className="w-5 h-5" /> : 
                     tx.type === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> : 
                     <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-main capitalize">{tx.type}</p>
                    <p className="text-sm text-muted">{users.find(u => u.id === tx.user_id)?.full_name || 'Unknown User'} • {new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-main">{tx.amount} {tx.strategy === 'INR' ? 'INR' : 'USD'}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleAddFunds = async (e: React.FormEvent, targetUserId: string | 'all') => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = Number(formData.get('amount'));
    if (!amount || isNaN(amount)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetUsers = targetUserId === 'all' ? users : users.filter(u => u.id === targetUserId);
      
      for (const u of targetUsers) {
        const { error } = await supabase.rpc('admin_add_funds', {
          target_user_id: u.id,
          amount: amount
        });
        if (error) throw error;
      }

      alert(`Successfully added $${amount} to ${targetUserId === 'all' ? 'all users' : 'user'}`);
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding funds:', error);
      alert('Failed to add funds');
    }
  };

  const renderUsers = () => {
    if (selectedUser) {
      const userTxs = transactions.filter(tx => tx.user_id === selectedUser.id);
      const userDeposits = userTxs.filter(tx => tx.type === 'deposit');
      const userWithdrawals = userTxs.filter(tx => tx.type === 'withdrawal');
      
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedUser(null)}
            className="text-muted hover:text-main flex items-center space-x-2 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Back to Users</span>
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <div className="bg-card border border-main rounded-2xl p-6 lg:col-span-1">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-black font-bold text-3xl mb-4">
                  {(selectedUser.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-display font-bold text-main">{selectedUser.full_name || 'Unknown'}</h2>
                <p className="text-muted">{selectedUser.email || 'No email'}</p>
                <div className="mt-4 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-medium">
                  Balance: ${selectedUser.available_balance || 0}
                </div>
              </div>
              
              <div className="space-y-4 border-t border-main pt-6">
                <div className="flex items-center space-x-3 text-main/80">
                  <MapPin className="w-5 h-5 text-muted" />
                  <span>{selectedUser.country || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-3 text-main/80">
                  <Calendar className="w-5 h-5 text-muted" />
                  <span>Joined {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
                
                {selectedUser.phone && (
                  <div className="flex items-center space-x-3 text-main/80">
                    <span className="text-muted font-medium w-5 text-center">☎</span>
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                
                {selectedUser.bank_accounts && selectedUser.bank_accounts.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs text-muted uppercase tracking-wider mb-2">Bank Accounts</h4>
                    {selectedUser.bank_accounts.map((bank: any, i: number) => (
                      <div key={i} className="bg-muted rounded p-2 text-xs text-muted mb-1">
                        {bank.bankName} - {bank.accountNumber} ({bank.ifsc})
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedUser.crypto_wallets && selectedUser.crypto_wallets.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs text-muted uppercase tracking-wider mb-2">Crypto Wallets</h4>
                    {selectedUser.crypto_wallets.map((wallet: any, i: number) => (
                      <div key={i} className="bg-muted rounded p-2 text-xs text-muted mb-1 break-all">
                        {wallet.network}: {wallet.address}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-main">
                <h3 className="text-sm font-medium text-muted mb-4 uppercase tracking-wider">Add Funds</h3>
                <form onSubmit={(e) => handleAddFunds(e, selectedUser.id)} className="space-y-3">
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount in USD"
                    required
                    step="0.01"
                    className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 rounded-lg transition-colors text-sm"
                  >
                    Add Funds
                  </button>
                </form>
              </div>

              <div className="mt-8 pt-6 border-t border-main">
                <h3 className="text-sm font-medium text-muted mb-4 uppercase tracking-wider">Send Notification</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setNotificationTarget(selectedUser.id);
                  handleSendNotification(e);
                }} className="space-y-3">
                  <textarea
                    value={notificationMsg}
                    onChange={(e) => setNotificationMsg(e.target.value)}
                    placeholder="Type message here..."
                    className="w-full bg-main border border-main rounded-xl p-3 text-main text-sm focus:outline-none focus:border-emerald-500 min-h-[100px]"
                  />
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 rounded-xl transition-all">
                    Send to User
                  </button>
                </form>
              </div>
            </div>
            
            {/* User Transactions */}
            <div className="bg-card border border-main rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-xl font-display font-bold text-main mb-6">Transaction History</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-main border border-main rounded-xl p-4">
                  <p className="text-muted text-sm mb-1">Total Deposits</p>
                  <p className="text-xl font-bold text-main">
                    ${userDeposits.filter(tx => tx.status === 'completed').reduce((sum, tx) => sum + Number(tx.amount || 0), 0)}
                  </p>
                </div>
                <div className="bg-main border border-main rounded-xl p-4">
                  <p className="text-muted text-sm mb-1">Total Withdrawals</p>
                  <p className="text-xl font-bold text-main">
                    ${userWithdrawals.filter(tx => tx.status === 'completed').reduce((sum, tx) => sum + Number(tx.amount || 0), 0)}
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-main text-sm text-muted">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {userTxs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted">No transactions found</td>
                      </tr>
                    ) : (
                      userTxs.map(tx => (
                        <tr key={tx.id} className="border-b border-main hover:bg-main/10">
                          <td className="py-3 text-muted">{new Date(tx.created_at).toLocaleDateString()}</td>
                          <td className="py-3 text-main capitalize">{tx.type}</td>
                          <td className="py-3 text-main font-medium">
                            {tx.amount} {tx.strategy === 'INR' ? 'INR' : 'USD'}
                            {tx.type === 'withdrawal' && tx.address && (
                              <div className="text-xs text-muted mt-1 font-mono break-all">
                                {tx.currency} ({tx.network}): {tx.address}
                              </div>
                            )}
                          </td>
                          <td className="py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {tx.status === 'pending' && (
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => handleApproveTransaction(tx.id, tx.type, tx.amount, tx.user_id, tx.strategy)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleRejectTransaction(tx.id, tx.type, tx.amount, tx.user_id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const filteredUsers = users.filter(user => 
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="bg-card border border-main rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-display font-bold text-main">Client Management</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-main border border-main rounded-xl pl-9 pr-4 py-2 text-sm text-main focus:outline-none focus:border-emerald-500"
              />
            </div>
            <form onSubmit={(e) => handleAddFunds(e, 'all')} className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="number"
                name="amount"
                placeholder="Amount to all ($)"
                required
                step="0.01"
                className="w-full sm:w-32 bg-main border border-main rounded-xl px-3 py-2 text-sm text-main focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-4 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Add to All
              </button>
            </form>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-main text-sm text-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Country</th>
                <th className="pb-3 font-medium">Balance</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-main hover:bg-main/10 cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <td className="py-4 text-main font-medium flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                      {(user.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span>{user.full_name || 'Unknown'}</span>
                  </td>
                  <td className="py-4 text-muted">{user.email || 'N/A'}</td>
                  <td className="py-4 text-muted">{user.country || 'N/A'}</td>
                  <td className="py-4 text-main font-medium">${user.available_balance || 0}</td>
                  <td className="py-4 text-right">
                    <button className="text-emerald-500 hover:text-emerald-400 text-sm font-medium">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTransactions = (type: 'deposit' | 'withdrawal') => {
    const filteredTxs = transactions.filter(tx => tx.type === type);
    
    return (
      <div className="bg-card border border-main rounded-2xl p-6">
        <h3 className="text-xl font-display font-bold text-main mb-6 capitalize">{type}s Management</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-main text-sm text-muted">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Method/Asset</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">No {type}s found</td>
                </tr>
              ) : (
                filteredTxs.map(tx => (
                  <tr key={tx.id} className="border-b border-main hover:bg-main/10">
                    <td className="py-4 text-muted">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="py-4 text-main font-medium">{users.find(u => u.id === tx.user_id)?.full_name || 'Unknown'}</td>
                    <td className="py-4 text-muted">{tx.strategy || 'N/A'}</td>
                    <td className="py-4 text-main font-bold">
                      {tx.amount} {tx.strategy === 'INR' ? 'INR' : 'USD'}
                      {tx.address && (
                        <div className="text-xs text-muted mt-1 font-mono break-all font-normal">
                          {tx.currency || tx.strategy} {tx.network ? `(${tx.network})` : ''}: {tx.address}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {tx.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleApproveTransaction(tx.id, tx.type, tx.amount, tx.user_id, tx.strategy)} 
                            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectTransaction(tx.id, tx.type, tx.amount, tx.user_id)} 
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleApproveDocument = async (id: string, userId: string) => {
    try {
      // Mark document as approved
      await supabase.from('support_messages').update({ status: 'document_approved' }).eq('id', id);
      
      // Update user profile
      await supabase.from('profiles').update({ 
        document_verified: true,
        document_status: 'approved'
      }).eq('id', userId);
      
      // Send notification to user
      await supabase.from('support_messages').insert([{
        user_id: userId,
        text: 'Your identity verification document has been approved. You are now 3/3 verified.',
        sender: 'admin'
      }]);
      
      setDocuments(documents.filter(doc => doc.id !== id));
      alert('Document approved');
    } catch (error) {
      console.error('Error approving document:', error);
      alert('Failed to approve document');
    }
  };

  const handleRejectDocument = async (id: string, userId: string) => {
    const reason = prompt('Enter reason for rejection:', 'Please upload a clearer image.');
    if (reason === null) return;

    try {
      // Mark document as rejected
      await supabase.from('support_messages').update({ status: 'document_rejected', notes: reason }).eq('id', id);
      
      // Update user profile
      await supabase.from('profiles').update({ 
        document_verified: false,
        document_status: 'rejected'
      }).eq('id', userId);

      // Send notification to user
      await supabase.from('support_messages').insert([{
        user_id: userId,
        text: `Your identity verification document was rejected. Reason: ${reason}`,
        sender: 'admin',
        status: 'unread'
      }]);
      
      setDocuments(documents.filter(doc => doc.id !== id));
      alert('Document rejected');
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Failed to reject document');
    }
  };

  const renderDocuments = () => {
    return (
      <div className="bg-card border border-main rounded-2xl p-6">
        <h3 className="text-xl font-display font-bold text-main mb-6">Document Verification</h3>
        
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-main rounded-xl">
            <FileText className="w-12 h-12 text-muted mb-4" />
            <h4 className="text-lg font-medium text-main mb-2">No Pending Documents</h4>
            <p className="text-muted max-w-md">
              All user verification documents have been processed. New submissions will appear here for approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map(doc => {
              // Parse the text which is in format: DOCUMENT_UPLOAD:type:filename:base64
              const parts = doc.text.split(':');
              const docType = parts[1] || 'Unknown';
              const fileName = parts[2] || 'document';
              const base64Data = parts.slice(3).join(':'); // Rejoin the rest in case base64 has colons
              
              return (
                <div key={doc.id} className="bg-main border border-main rounded-xl p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-main">{users.find(u => u.id === doc.user_id)?.full_name || 'Unknown User'}</h4>
                      <p className="text-sm text-muted">{users.find(u => u.id === doc.user_id)?.email || 'No email'}</p>
                    </div>
                    <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded-full font-medium">
                      Pending
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-muted mb-1">Document Type: <span className="text-main capitalize">{docType}</span></p>
                    <p className="text-sm text-muted">File: <span className="text-main">{fileName}</span></p>
                  </div>
                  
                  {base64Data && base64Data.startsWith('data:image') ? (
                    <div className="w-full h-48 bg-muted rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                      <img src={base64Data} alt="Document" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg mb-4 flex items-center justify-center text-muted">
                      <FileText className="w-12 h-12" />
                    </div>
                  )}
                  
                  <div className="mt-auto flex space-x-3">
                    <button 
                      onClick={() => handleApproveDocument(doc.id, doc.user_id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectDocument(doc.id, doc.user_id)}
                      className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black font-bold py-2 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const calculateAllocations = (strategyId: string) => {
    const allocations: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.strategy === strategyId && tx.status === 'completed') {
        if (tx.type === 'strategy_allocation') {
          allocations[tx.user_id] = (allocations[tx.user_id] || 0) + Number(tx.amount);
        } else if (tx.type === 'strategy_withdrawal') {
          allocations[tx.user_id] = (allocations[tx.user_id] || 0) - Number(tx.amount);
        }
      }
    });
    return allocations;
  };

  const handleAddTradeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const strategyId = formData.get('strategy') as string;
    const asset = formData.get('asset') as string;
    const margin = Number(formData.get('margin'));
    const profit = Number(formData.get('profit'));
    const isWin = formData.get('isWin') === 'true';
    const entryTime = formData.get('entryTime') as string;
    const exitTime = formData.get('exitTime') as string;

    if (!strategyId || !asset || !margin || isNaN(profit)) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const logData = { strategyId, asset, margin, profit, isWin, entryTime, exitTime };
      
      // Save trade log
      const { error: logError } = await supabase.from('support_messages').insert([{
        user_id: user.id,
        text: JSON.stringify(logData),
        sender: 'trade_log',
        status: 'completed'
      }]);

      if (logError) throw logError;

      // Calculate profit distribution
      if (profit !== 0) {
        const profitPercentage = profit / margin;
        const allocations = calculateAllocations(strategyId);
        
        const yieldTxs = [];
        const profileUpdates = [];

        for (const [userId, allocatedAmount] of Object.entries(allocations)) {
          if (allocatedAmount > 0) {
            const userProfit = allocatedAmount * profitPercentage;
            
            yieldTxs.push({
              user_id: userId,
              type: 'yield',
              amount: userProfit,
              strategy: strategyId,
              status: 'completed'
            });
          }
        }

        if (yieldTxs.length > 0) {
          for (const tx of yieldTxs) {
            const { error } = await supabase.rpc('process_allocation', {
              user_id: tx.user_id,
              amount: tx.amount,
              strategy: tx.strategy,
              is_allocation: false,
              tx_type: 'yield'
            });
            if (error) throw error;
          }
        }
      }

      alert('Trade log added and profits distributed successfully!');
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding trade log:', error);
      alert('Failed to add trade log');
    }
  };

  const renderTradeLogs = () => {
    const totalTrades = tradeLogs.length;
    const wonTrades = tradeLogs.filter(log => {
      try { return JSON.parse(log.text).isWin; } catch(e) { return false; }
    }).length;
    const lostTrades = totalTrades - wonTrades;
    const winRate = totalTrades > 0 ? ((wonTrades / totalTrades) * 100).toFixed(1) : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-main p-4 rounded-xl">
            <p className="text-muted text-sm mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-main">{totalTrades}</p>
          </div>
          <div className="bg-card border border-main p-4 rounded-xl">
            <p className="text-muted text-sm mb-1">Won Trades</p>
            <p className="text-2xl font-bold text-emerald-500">{wonTrades}</p>
          </div>
          <div className="bg-card border border-main p-4 rounded-xl">
            <p className="text-muted text-sm mb-1">Lost Trades</p>
            <p className="text-2xl font-bold text-red-500">{lostTrades}</p>
          </div>
          <div className="bg-card border border-main p-4 rounded-xl">
            <p className="text-muted text-sm mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-main">{winRate}%</p>
          </div>
        </div>

        <div className="bg-card border border-main rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-main mb-2">Trade Logs</h3>
          <p className="text-muted mb-6 text-sm">Log trades to automatically distribute yields based on user allocations.</p>
          
          <form onSubmit={handleAddTradeLog} data-trade-form className="space-y-4 mb-8 bg-main border border-main p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-main">Add New Trade</h4>
              <button 
                type="button"
                onClick={handleAiGenerateTrade}
                disabled={isGeneratingTrade}
                className="flex items-center space-x-2 text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-all border border-emerald-500/20"
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingTrade ? 'animate-spin' : ''}`} />
                <span>{isGeneratingTrade ? 'Generating...' : 'AI Generate Trade'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Strategy</label>
                <select name="strategy" required className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none">
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Asset (e.g., BTC/USD)</label>
                <input type="text" name="asset" required className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Margin ($)</label>
                <input type="number" name="margin" required step="0.01" className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Entry Time</label>
                <input type="datetime-local" name="entryTime" required className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Exit Time</label>
                <input type="datetime-local" name="exitTime" required className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Profit/Loss ($)</label>
                <input type="number" name="profit" required step="0.01" className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Result</label>
                <select name="isWin" required className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none">
                  <option value="true">Win</option>
                  <option value="false">Loss</option>
                </select>
              </div>
            </div>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-xl transition-all">
              Log Trade & Distribute Yield
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-main text-sm text-muted">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Strategy</th>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Margin</th>
                  <th className="pb-3 font-medium">Profit</th>
                  <th className="pb-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {tradeLogs.map(log => {
                  let data;
                  try { data = JSON.parse(log.text); } catch(e) { return null; }
                  return (
                    <tr key={log.id} className="border-b border-main hover:bg-main/10">
                      <td className="py-4 text-muted">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-4 text-main font-medium capitalize">{data.strategyId}</td>
                      <td className="py-4 text-muted">{data.asset}</td>
                      <td className="py-4 text-main">${data.margin}</td>
                      <td className={`py-4 font-bold ${data.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ${data.profit}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${data.isWin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {data.isWin ? 'Win' : 'Loss'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const handleReplyTicket = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const text = formData.get('reply') as string;
    if (!text) return;

    try {
      const { error } = await supabase.from('support_messages').insert([{
        user_id: userId,
        text,
        sender: 'admin',
        status: 'completed'
      }]);
      if (error) throw error;
      alert('Reply sent successfully');
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    }
  };

  const renderSupport = () => {
    // Group tickets by user
    const userTickets: Record<string, any[]> = {};
    supportTickets.forEach(ticket => {
      if (!userTickets[ticket.user_id]) userTickets[ticket.user_id] = [];
      userTickets[ticket.user_id].push(ticket);
    });

    return (
      <div className="space-y-6">
        <div className="bg-card border border-main rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-main mb-6">Support Tickets</h3>
          
          {Object.keys(userTickets).length === 0 ? (
            <div className="text-center py-8 text-muted">No support tickets found</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(userTickets).map(([userId, tickets]) => {
                const user = users.find(u => u.id === userId);
                return (
                  <div key={userId} className="bg-main border border-main rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-main pb-2">
                      <h4 className="font-bold text-main">{user?.full_name || 'Unknown User'} <span className="text-muted text-sm font-normal">({user?.email})</span></h4>
                    </div>
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {tickets.map(ticket => (
                        <div key={ticket.id} className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted mb-1">{new Date(ticket.created_at).toLocaleString()}</p>
                          <p className="text-muted text-sm">{ticket.text}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={(e) => handleReplyTicket(e, userId)} className="flex space-x-2">
                      <input type="text" name="reply" placeholder="Type your reply..." required className="flex-1 bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none" />
                      <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-4 rounded-lg transition-all text-sm">
                        Reply
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const upiId = formData.get('upiId') as string;
    const upiQr = formData.get('upiQr') as string;
    const minDeposit = Number(formData.get('minDeposit'));
    const bankName = formData.get('bankName') as string;
    const accountName = formData.get('accountName') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const ifscCode = formData.get('ifscCode') as string;
    const bankBranch = formData.get('bankBranch') as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsData = { 
        upiId, 
        upiQr, 
        minDeposit, 
        bankName, 
        accountName, 
        accountNumber, 
        ifscCode, 
        bankBranch 
      };
      
      // Delete existing settings
      await supabase.from('support_messages').delete().eq('sender', 'system_settings');

      // Save new settings
      const { error } = await supabase.from('support_messages').insert([{
        user_id: user.id,
        text: JSON.stringify(settingsData),
        sender: 'system_settings',
        status: 'completed'
      }]);

      if (error) throw error;
      alert('Settings updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Platform Settings */}
          <div className="bg-card border border-main rounded-2xl p-6">
            <h3 className="text-xl font-display font-bold text-main mb-6">Platform Settings</h3>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">UPI ID</label>
                  <input 
                    type="text" 
                    name="upiId" 
                    defaultValue={globalSettings.upiId} 
                    required 
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Min Deposit (USD)</label>
                  <input 
                    type="number" 
                    name="minDeposit" 
                    defaultValue={globalSettings.minDeposit || 100} 
                    required 
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted mb-2">UPI QR Code URL</label>
                <input 
                  type="text" 
                  name="upiQr" 
                  defaultValue={globalSettings.upiQr} 
                  placeholder="https://example.com/qr.png"
                  className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-xl transition-all">
                Update Platform Settings
              </button>
            </form>
          </div>

          {/* Card 2: Bank Details */}
          <div className="bg-card border border-main rounded-2xl p-6">
            <h3 className="text-xl font-display font-bold text-main mb-6">Bank Deposit Details</h3>
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Bank Name</label>
                  <input 
                    type="text" 
                    name="bankName" 
                    defaultValue={globalSettings.bankName} 
                    placeholder="e.g. HDFC Bank"
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Account Name</label>
                  <input 
                    type="text" 
                    name="accountName" 
                    defaultValue={globalSettings.accountName} 
                    placeholder="e.g. Elde Trades Ltd"
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Account Number</label>
                  <input 
                    type="text" 
                    name="accountNumber" 
                    defaultValue={globalSettings.accountNumber} 
                    placeholder="Account Number"
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">IFSC / Swift Code</label>
                  <input 
                    type="text" 
                    name="ifscCode" 
                    defaultValue={globalSettings.ifscCode} 
                    placeholder="IFSC Code"
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-xl transition-all">
                Update Bank Details
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderStrategies = () => {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-main rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-main mb-2">Strategies & Yield Control</h3>
          <p className="text-muted mb-6 text-sm">Update the performance and conversion rates across the platform.</p>
          
          <form onSubmit={handleUpdateStrategies} className="space-y-8">
            <div>
              <h4 className="text-lg font-medium text-main mb-4 border-b border-main pb-2">Strategy Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {strategies.map((strategy, index) => (
                  <div key={strategy.id} className="bg-main border border-main rounded-xl p-4">
                    <p className="font-medium text-main mb-3">{strategy.name}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-muted mb-1">Current APY (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={strategy.apy}
                          onChange={(e) => {
                            const newStrats = [...strategies];
                            newStrats[index].apy = Number(e.target.value);
                            setStrategies(newStrats);
                          }}
                          className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">Add Profit (USD)</label>
                        <input 
                          type="number" 
                          value={strategy.profit}
                          onChange={(e) => {
                            const newStrats = [...strategies];
                            newStrats[index].profit = Number(e.target.value);
                            setStrategies(newStrats);
                          }}
                          className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted mb-1 uppercase">Daily %</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={strategy.daily_return}
                            onChange={(e) => {
                              const newStrats = [...strategies];
                              newStrats[index].daily_return = Number(e.target.value);
                              setStrategies(newStrats);
                            }}
                            className="w-full bg-transparent border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-1 uppercase">Weekly %</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={strategy.weekly_return}
                            onChange={(e) => {
                              const newStrats = [...strategies];
                              newStrats[index].weekly_return = Number(e.target.value);
                              setStrategies(newStrats);
                            }}
                            className="w-full bg-transparent border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-1 uppercase">Monthly %</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={strategy.monthly_return}
                            onChange={(e) => {
                              const newStrats = [...strategies];
                              newStrats[index].monthly_return = Number(e.target.value);
                              setStrategies(newStrats);
                            }}
                            className="w-full bg-transparent border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-main mb-4 border-b border-main pb-2">Fiat Conversion Rates</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Deposit Rates */}
                <div>
                  <h5 className="text-sm font-medium text-main mb-3">Deposit Rates (Tiered)</h5>
                  <div className="space-y-4">
                    <div className="bg-main/30 p-4 rounded-xl border border-main/20">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-bold text-muted uppercase">Bank Deposit Tiers</p>
                        <button 
                          type="button"
                          onClick={() => {
                            const newTiers = [...(conversionRates.bankTiers || []), { min: 0, rate: 0 }];
                            setConversionRates({ ...conversionRates, bankTiers: newTiers });
                          }}
                          className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
                        >
                          + Add Tier
                        </button>
                      </div>
                      <div className="space-y-3">
                        {conversionRates.bankTiers?.map((tier: any, i: number) => (
                          <div key={`bank-tier-${i}`} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Min Amount ($)</label>
                              <input 
                                type="number" 
                                value={tier.min}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.bankTiers];
                                  newTiers[i].min = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, bankTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Rate (INR)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                value={tier.rate}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.bankTiers];
                                  newTiers[i].rate = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, bankTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newTiers = conversionRates.bankTiers.filter((_: any, index: number) => index !== i);
                                  setConversionRates({ ...conversionRates, bankTiers: newTiers });
                                }}
                                className="w-full bg-red-500/10 text-red-500 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-main/30 p-4 rounded-xl border border-main/20">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-bold text-muted uppercase">UPI Deposit Tiers</p>
                        <button 
                          type="button"
                          onClick={() => {
                            const newTiers = [...(conversionRates.upiTiers || []), { min: 0, rate: 0 }];
                            setConversionRates({ ...conversionRates, upiTiers: newTiers });
                          }}
                          className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
                        >
                          + Add Tier
                        </button>
                      </div>
                      <div className="space-y-3">
                        {conversionRates.upiTiers?.map((tier: any, i: number) => (
                          <div key={`upi-tier-${i}`} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Min Amount ($)</label>
                              <input 
                                type="number" 
                                value={tier.min}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.upiTiers];
                                  newTiers[i].min = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, upiTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Rate (INR)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                value={tier.rate}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.upiTiers];
                                  newTiers[i].rate = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, upiTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newTiers = conversionRates.upiTiers.filter((_: any, index: number) => index !== i);
                                  setConversionRates({ ...conversionRates, upiTiers: newTiers });
                                }}
                                className="w-full bg-red-500/10 text-red-500 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Rates */}
                <div>
                  <h5 className="text-sm font-medium text-main mb-3">Withdrawal Rates (Crypto to Fiat)</h5>
                  <div className="space-y-3">
                    {['INR', 'GBP', 'EUR'].map((currency) => (
                      <div key={`with-${currency}`}>
                        <label className="block text-xs text-muted mb-1">1 USD = {currency}</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={conversionRates.withdrawalRates?.[currency] || (1 / (Number(conversionRates[currency]) || 1)).toFixed(2)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) {
                              setConversionRates({
                                ...conversionRates, 
                                withdrawalRates: { ...conversionRates.withdrawalRates, [currency]: val }
                              });
                            }
                          }}
                          className="w-full bg-main border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-main mb-4 border-b border-main pb-2">Deposit Limits</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Minimum Deposit (USD)</label>
                  <input 
                    type="number" 
                    step="1"
                    value={conversionRates.minDepositUSD || 100}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) {
                        setConversionRates({...conversionRates, minDepositUSD: val});
                      }
                    }}
                    className="w-full bg-main border border-main rounded-lg px-3 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-main flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm text-main">
                  <input type="radio" name="updateTarget" value="all" checked={updateTarget === 'all'} onChange={() => setUpdateTarget('all')} className="text-emerald-500 focus:ring-emerald-500" />
                  <span>Apply to all users</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-main">
                  <input type="radio" name="updateTarget" value="selected" checked={updateTarget === 'selected'} onChange={() => setUpdateTarget('selected')} className="text-emerald-500 focus:ring-emerald-500" />
                  <span>Selected users only</span>
                </label>
              </div>
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-xl transition-all">
                Publish Updates
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (authChecking) {
    return (
      <DashboardLayout session={session}>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout session={session}>
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-main mb-2">Access Denied</h2>
          <p className="text-muted max-w-md">
            You do not have permission to view this page. If you believe this is an error, please contact support.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-main">Admin Control Panel</h1>
            <p className="text-muted">Manage users, transactions, and platform settings.</p>
          </div>
          <button onClick={fetchData} className="flex items-center space-x-2 bg-muted hover:bg-main/10 text-main px-4 py-2 rounded-xl border border-main transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' ? (
                <div className="space-y-8">
                  {renderOverview()}
                  
                  <div>
                    <h2 className="text-xl font-display font-bold text-main mb-4">Admin Tools</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[
                        { id: 'users', label: 'Clients', icon: Users, desc: 'Manage users and balances' },
                        { id: 'deposits', label: 'Deposits', icon: ArrowDownRight, desc: 'Approve deposit requests' },
                        { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight, desc: 'Process withdrawals' },
                        { id: 'verifications', label: 'Verifications', icon: ShieldCheck, desc: 'Review KYC documents' },
                        { id: 'payments', label: 'Payment Audit', icon: CreditCard, desc: 'View all transactions' },
                        { id: 'strategies', label: 'Yields & Rates', icon: TrendingUp, desc: 'Update APY and exchange rates' },
                        { id: 'trade_logs', label: 'Trade Logs', icon: Activity, desc: 'Log trades and distribute profits' },
                        { id: 'support', label: 'Support Tickets', icon: Headset, desc: 'Respond to user queries' },
                        { id: 'settings', label: 'Settings', icon: Settings, desc: 'Global platform settings' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setSelectedUser(null);
                          }}
                          className="bg-card border border-main hover:border-emerald-500/50 hover:bg-main/10 rounded-2xl p-6 text-left transition-all group flex flex-col items-start"
                        >
                          <div className="w-10 h-10 bg-muted group-hover:bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 transition-colors">
                            <tab.icon className="w-5 h-5 text-muted group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <h3 className="text-main font-bold mb-1">{tab.label}</h3>
                          <p className="text-xs text-muted">{tab.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className="text-muted hover:text-main flex items-center space-x-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Overview</span>
                  </button>
                  
                  {activeTab === 'users' && renderUsers()}
                  {activeTab === 'deposits' && renderTransactions('deposit')}
                  {activeTab === 'withdrawals' && renderTransactions('withdrawal')}
                  {activeTab === 'verifications' && renderDocuments()}
                  {activeTab === 'payments' && renderPayments()}
                  {activeTab === 'trade_logs' && renderTradeLogs()}
                  {activeTab === 'support' && renderSupport()}
                  {activeTab === 'settings' && renderSettings()}

                  {activeTab === 'strategies' && (
                    <div className="space-y-8">
            {/* Strategy Management */}
            <div className="bg-card border border-main rounded-2xl p-6">
              <h3 className="text-xl font-display font-bold text-main mb-6">Strategy Management</h3>
              <form onSubmit={handleUpdateStrategies} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {strategies.map((strat, idx) => (
                    <div key={strat.id} className="bg-main border border-main rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-main">{strat.name}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-${strat.color}-500/10 text-${strat.color}-500`}>
                          {strat.risk} Risk
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted mb-1">Target APY (%)</label>
                          <input
                            type="number"
                            value={strat.apy}
                            onChange={(e) => {
                              const newStrats = [...strategies];
                              newStrats[idx].apy = e.target.value;
                              setStrategies(newStrats);
                            }}
                            className="w-full bg-muted border border-main rounded-lg px-3 py-2 text-main text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Daily Return (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={strat.daily_return}
                            onChange={(e) => {
                              const newStrats = [...strategies];
                              newStrats[idx].daily_return = e.target.value;
                              setStrategies(newStrats);
                            }}
                            className="w-full bg-muted border border-main rounded-lg px-3 py-2 text-main text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Weekly Return (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={strat.weekly_return}
                            onChange={(e) => {
                              const newStrats = [...strategies];
                              newStrats[idx].weekly_return = e.target.value;
                              setStrategies(newStrats);
                            }}
                            className="w-full bg-muted border border-main rounded-lg px-3 py-2 text-main text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Monthly Return (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={strat.monthly_return}
                            onChange={(e) => {
                              const newStrats = [...strategies];
                              newStrats[idx].monthly_return = e.target.value;
                              setStrategies(newStrats);
                            }}
                            className="w-full bg-muted border border-main rounded-lg px-3 py-2 text-main text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-8 rounded-xl transition-all">
                    Save Strategy Settings
                  </button>
                </div>
              </form>
            </div>

            {/* Fiat Conversion Rates */}
            <div className="bg-card border border-main rounded-2xl p-6">
              <h3 className="text-xl font-display font-bold text-main mb-6">Fiat Conversion Rates</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Deposit Rates */}
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Deposit Rates (Tiered)</h4>
                  <div className="space-y-6">
                    {/* Bank Tiers */}
                    <div className="bg-main/30 p-4 rounded-xl border border-main/20">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-bold text-main uppercase">Bank Deposit Tiers</p>
                        <button 
                          type="button"
                          onClick={() => {
                            const newTiers = [...(conversionRates.bankTiers || []), { min: 0, rate: 0 }];
                            setConversionRates({ ...conversionRates, bankTiers: newTiers });
                          }}
                          className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
                        >
                          + Add Tier
                        </button>
                      </div>
                      <div className="space-y-3">
                        {conversionRates.bankTiers?.map((tier: any, i: number) => (
                          <div key={`bank-tier-${i}`} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Min Amount ($)</label>
                              <input 
                                type="number" 
                                value={tier.min}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.bankTiers];
                                  newTiers[i].min = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, bankTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Rate (INR)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                value={tier.rate}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.bankTiers];
                                  newTiers[i].rate = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, bankTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newTiers = conversionRates.bankTiers.filter((_: any, index: number) => index !== i);
                                  setConversionRates({ ...conversionRates, bankTiers: newTiers });
                                }}
                                className="w-full bg-red-500/10 text-red-500 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* UPI Tiers */}
                    <div className="bg-main/30 p-4 rounded-xl border border-main/20">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-bold text-main uppercase">UPI Deposit Tiers</p>
                        <button 
                          type="button"
                          onClick={() => {
                            const newTiers = [...(conversionRates.upiTiers || []), { min: 0, rate: 0 }];
                            setConversionRates({ ...conversionRates, upiTiers: newTiers });
                          }}
                          className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
                        >
                          + Add Tier
                        </button>
                      </div>
                      <div className="space-y-3">
                        {conversionRates.upiTiers?.map((tier: any, i: number) => (
                          <div key={`upi-tier-${i}`} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Min Amount ($)</label>
                              <input 
                                type="number" 
                                value={tier.min}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.upiTiers];
                                  newTiers[i].min = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, upiTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-5">
                              <label className="block text-[10px] text-muted mb-1">Rate (INR)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                value={tier.rate}
                                onChange={(e) => {
                                  const newTiers = [...conversionRates.upiTiers];
                                  newTiers[i].rate = Number(e.target.value);
                                  setConversionRates({ ...conversionRates, upiTiers: newTiers });
                                }}
                                className="w-full bg-main border border-main rounded-lg px-2 py-1.5 text-main text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newTiers = conversionRates.upiTiers.filter((_: any, index: number) => index !== i);
                                  setConversionRates({ ...conversionRates, upiTiers: newTiers });
                                }}
                                className="w-full bg-red-500/10 text-red-500 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Rates */}
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Withdrawal Rates (Crypto to Fiat)</h4>
                  <div className="space-y-4">
                    {['INR', 'GBP', 'EUR'].map((currency) => (
                      <div key={`with-${currency}`} className="bg-main/30 p-4 rounded-xl border border-main/20">
                        <label className="block text-xs text-muted mb-2 uppercase tracking-wider">1 USD = {currency}</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={conversionRates.withdrawalRates?.[currency] || (1 / (Number(conversionRates[currency]) || 1)).toFixed(2)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) {
                              setConversionRates({
                                ...conversionRates, 
                                withdrawalRates: { ...conversionRates.withdrawalRates, [currency]: val }
                              });
                            }
                          }}
                          className="w-full bg-main border border-main rounded-xl px-4 py-2 text-main text-sm focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleUpdateStrategies}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-8 rounded-xl transition-all"
                >
                  Save Conversion Rates
                </button>
              </div>
            </div>

            {/* Log Performance */}
            <div className="bg-card border border-main rounded-2xl p-6">
              <h3 className="text-xl font-display font-bold text-main mb-6">Log Performance & Distribute Yield</h3>
              <p className="text-muted text-sm mb-6">
                Logging a performance event will automatically calculate and distribute yield to all users currently invested in that strategy.
              </p>
              
              <form onSubmit={handleLogPerformance} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Strategy</label>
                  <select
                    value={newPerformance.strategyId}
                    onChange={(e) => setNewPerformance({ ...newPerformance, strategyId: e.target.value })}
                    className="w-full bg-muted border border-main rounded-xl px-4 py-2.5 text-main text-sm focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="" className="bg-card">Select Strategy</option>
                    {strategies.map(s => (
                      <option key={s.id} value={s.id} className="bg-card">{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={newPerformance.date}
                    onChange={(e) => setNewPerformance({ ...newPerformance, date: e.target.value })}
                    className="w-full bg-muted border border-main rounded-xl px-4 py-2.5 text-main text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Return (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPerformance.returnPercent}
                    onChange={(e) => setNewPerformance({ ...newPerformance, returnPercent: e.target.value })}
                    placeholder="e.g. 0.5"
                    className="w-full bg-muted border border-main rounded-xl px-4 py-2.5 text-main text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl transition-all">
                  Log & Distribute
                </button>
              </form>

              <div className="mt-8">
                <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Recent Performance Logs</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-main text-xs text-muted">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Strategy</th>
                        <th className="pb-2">Return</th>
                        <th className="pb-2 text-right">Logged At</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {performanceLogs.slice(0, 10).map(log => (
                        <tr key={log.id} className="border-b border-main">
                          <td className="py-2 text-main">{log.date}</td>
                          <td className="py-2 text-muted">{strategies.find(s => s.id === log.strategyId)?.name || log.strategyId}</td>
                          <td className="py-2 text-emerald-400 font-bold">+{log.returnPercent}%</td>
                          <td className="py-2 text-muted text-right text-xs">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'trade_logs' && renderTradeLogs()}
        {activeTab === 'support' && renderSupport()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    )}
  </>
)}
        </div>
      </div>
    </DashboardLayout>
  );
}
