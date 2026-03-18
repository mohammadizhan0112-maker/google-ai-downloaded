import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Withdraw({ session }: { session: any }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [currency, setCurrency] = useState('');
  const [network, setNetwork] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [cryptoMethods, setCryptoMethods] = useState<any[]>([
    { asset: 'USDT', network: 'TRC20' },
    { asset: 'USDT', network: 'ERC20' },
    { asset: 'USDT', network: 'BEP20' },
    { asset: 'BTC', network: 'Bitcoin' },
    { asset: 'BNB', network: 'BEP20' },
    { asset: 'BNB', network: 'ERC20' },
    { asset: 'SOL', network: 'Solana' },
    { asset: 'USDC', network: 'Base' },
    { asset: 'USDC', network: 'TRC20' },
    { asset: 'USDC', network: 'BEP20' },
    { asset: 'USDC', network: 'Solana' },
    { asset: 'USDC', network: 'ERC20' }
  ]);
  const [verificationLevel, setVerificationLevel] = useState(1);
  const platformFee = 2.00;
  const [networkFee, setNetworkFee] = useState(0);

  useEffect(() => {
    // Estimate network fee based on selected network
    const fees: { [key: string]: number } = {
      'TRC20': 1.00,
      'ERC20': 15.00,
      'BEP20': 0.50,
      'Bitcoin': 10.00,
      'Solana': 0.10,
      'Base': 0.10
    };
    setNetworkFee(fees[network] || 0);
  }, [network]);

  const referralWithdrawable = (profile?.referral_balance || 0) >= 100;
  const withdrawableBalance = (profile?.available_balance || 0) + (referralWithdrawable ? (profile?.referral_balance || 0) : 0);
  
  const totalDeduction = Number(amount) > 0 ? Number(amount) + platformFee + networkFee : 0;
  const canWithdraw = withdrawableBalance >= totalDeduction;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_crypto')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const methods = JSON.parse(data[0].text);
          if (methods && Array.isArray(methods) && methods.length > 0) {
            setCryptoMethods(methods);
            setCurrency(methods[0].asset);
            setNetwork(methods[0].network);
          }
        }
      } catch (err) {
        console.error('Error fetching crypto settings:', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, available_balance, referral_balance')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          setCryptoWallets(user.user_metadata.cryptoWallets || []);
          
          let level = 1;
          if (user.user_metadata.phone && user.user_metadata.address) level = 2;
          if (user.user_metadata.document_verified) level = 3;
          setVerificationLevel(level);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    fetchProfile();
  }, [session.user.id]);

  // Update network when currency changes
  useEffect(() => {
    if (cryptoMethods.length > 0 && currency) {
      const availableNetworks = cryptoMethods.filter(m => m.asset === currency).map(m => m.network);
      if (availableNetworks.length > 0 && !availableNetworks.includes(network)) {
        setNetwork(availableNetworks[0]);
      }
    }
  }, [currency, cryptoMethods]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (verificationLevel < 2) {
        alert('You need to have at least 2/3 verification to withdraw. Please complete your profile details in Settings.');
        setIsSubmitting(false);
        return;
      }

      if (!profile || withdrawableBalance < totalDeduction) {
        alert('Insufficient withdrawable balance to cover withdrawal amount and fees');
        setIsSubmitting(false);
        return;
      }

      // Call RPC to handle withdrawal and balance deduction atomically
      const { data: rpcData, error: txError } = await supabase.rpc('request_withdrawal', {
        user_id: session.user.id,
        amount: Number(amount),
        strategy: 'Main Wallet',
        address: address,
        currency: currency,
        network: network,
        fee: platformFee + networkFee,
        referral_withdrawable: referralWithdrawable
      });

      if (txError) {
        alert(`Withdrawal failed: ${txError.message}`);
        throw txError;
      }

      // Save crypto wallet if it's new
      const isExisting = cryptoWallets.some(wallet => wallet.address === address);
      if (!isExisting) {
        const newWallet = {
          id: Date.now().toString(),
          network: `${currency} ${network}`,
          address,
        };
        const newWallets = [...cryptoWallets, newWallet];
        
        // Save to metadata
        await supabase.auth.updateUser({ data: { cryptoWallets: newWallets } });
        
        // Save to profiles table
        await supabase.from('profiles').update({ crypto_wallets: newWallets }).eq('id', session.user.id);
        
        // Log the update for admin audit
        await supabase.from('support_messages').insert([{
          user_id: session.user.id,
          text: `PAYMENT_METHOD_UPDATE:CRYPTO:${JSON.stringify(newWallet)}`,
          sender: 'system',
          status: 'completed'
        }]);

        setCryptoWallets(newWallets);
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setIsSubmitting(false);
      alert('Failed to process withdrawal. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <DashboardLayout session={session}>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-main mb-4">Withdrawal Initiated</h2>
          <p className="text-muted text-center mb-8">
            Your request to withdraw {amount} {currency} via {network} network has been received. 
            It will be processed shortly.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-xl transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <div className="max-w-3xl mx-auto space-y-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-muted hover:text-main flex items-center space-x-2 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-card border border-main rounded-3xl p-8 md:p-10">
          <h1 className="text-3xl font-display font-bold text-main mb-2">Withdraw Crypto</h1>
          <p className="text-muted mb-8">Transfer your crypto assets to an external wallet.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Select Currency</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Array.from(new Set(cryptoMethods.map(m => m.asset))).map(asset => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => setCurrency(asset)}
                    className={`px-4 py-3 rounded-xl border font-bold transition-all ${
                      currency === asset 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                        : 'border-main bg-muted text-muted hover:border-hover'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Selection */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Select Network</label>
              <div className="flex flex-wrap gap-3">
                {cryptoMethods.filter(m => m.asset === currency).map(m => (
                  <button
                    key={m.network}
                    type="button"
                    onClick={() => setNetwork(m.network)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      network === m.network 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                        : 'border-main bg-muted text-muted hover:border-hover'
                    }`}
                  >
                    {m.network}
                    {m.network === 'BEP20' && currency === 'USDT' && (
                      <span className="ml-2 text-[10px] bg-emerald-500 text-black px-1 rounded">RECOMMENDED</span>
                    )}
                  </button>
                ))}
              </div>
              {currency === 'USDT' && network !== 'BEP20' && (
                <p className="mt-2 text-xs text-emerald-500/70">
                  Tip: BNB (BEP20) is recommended for USDT withdrawals as it has the lowest fees.
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-muted">Withdrawal Address</label>
                {cryptoWallets.length > 0 && (
                  <select
                    className="text-xs bg-transparent text-emerald-500 focus:outline-none cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value) {
                        const wallet = cryptoWallets.find(w => w.id === e.target.value);
                        if (wallet) {
                          setAddress(wallet.address);
                          // Try to infer network from saved wallet
                          const parts = wallet.network.split(' ');
                          if (parts.length > 1) {
                            setNetwork(parts[1]);
                          }
                        }
                      }
                    }}
                  >
                    <option value="">Select saved wallet...</option>
                    {cryptoWallets.map(w => (
                      <option key={w.id} value={w.id}>{w.network} - {w.address.substring(0, 8)}...</option>
                    ))}
                  </select>
                )}
              </div>
              <input 
                type="text" 
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={`Enter ${network} address`}
                className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="flex items-start space-x-2 mt-2 text-orange-400/80 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>Ensure the network matches the withdrawal address. Sending to the wrong network will result in permanent loss of funds.</p>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Amount</label>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-main border border-main rounded-xl pl-4 pr-20 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-medium">
                  {currency}
                </div>
              </div>
            </div>

            {/* Withdrawal Summary */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-muted border border-main rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-main uppercase tracking-wider mb-2">Withdrawal Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Amount to Withdraw</span>
                  <span className="text-main font-medium">{amount} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Platform Fee</span>
                  <span className="text-main font-medium">${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Network Fee ({network})</span>
                  <span className="text-main font-medium">${networkFee.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-main flex justify-between items-center">
                  <span className="text-main font-bold">Total Deduction</span>
                  <span className="text-emerald-500 font-bold text-lg">
                    ${totalDeduction.toFixed(2)}
                  </span>
                </div>
                {!canWithdraw && (
                  <p className="text-xs text-red-500 mt-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Insufficient balance to cover amount and fees
                  </p>
                )}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || !address || !canWithdraw}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            >
              {isSubmitting ? 'Processing...' : `Withdraw ${amount || '0'} ${currency}`}
            </button>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
