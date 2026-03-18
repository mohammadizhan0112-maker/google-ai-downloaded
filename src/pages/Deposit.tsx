import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Wallet, Smartphone, CheckCircle2, Copy, QrCode } from 'lucide-react';

export default function Deposit({ session }: { session: any }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [method, setMethod] = useState<'CRYPTO' | 'UPI' | 'BANK'>('CRYPTO');
  
  // Bank state
  const [bankDetails, setBankDetails] = useState<any>({
    bankName: 'coming soon',
    accountName: 'coming soon',
    accountNumber: 'coming soon',
    ifscCode: 'coming soon',
    bankBranch: 'coming soon'
  });
  const [bankAmount, setBankAmount] = useState('');
  const [bankRef, setBankRef] = useState('');
  
  // Crypto state
  const [cryptoMethods, setCryptoMethods] = useState<any[]>([
    { asset: 'USDT', network: 'TRC20', address: 'TR1ajLYHHKyA7LUgDVJ1i2BYzckUgACP87' },
    { asset: 'USDT', network: 'ERC20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'USDT', network: 'BEP20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'BTC', network: 'Bitcoin', address: 'bc1quez996jxpluemzuykx2m45wfs2q87kz0fu9dda' },
    { asset: 'BNB', network: 'BEP20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'BNB', network: 'ERC20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'SOL', network: 'Solana', address: '7FLnTudwmsfJ8J3W3TSdWhyG7AXxAKDM84N4bpFXT3bL' },
    { asset: 'USDC', network: 'Base', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'USDC', network: 'TRC20', address: 'TR1ajLYHHKyA7LUgDVJ1i2BYzckUgACP87' },
    { asset: 'USDC', network: 'BEP20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'USDC', network: 'Solana', address: '7FLnTudwmsfJ8J3W3TSdWhyG7AXxAKDM84N4bpFXT3bL' },
    { asset: 'USDC', network: 'ERC20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' }
  ]);
  const [cryptoAsset, setCryptoAsset] = useState('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [copied, setCopied] = useState(false);

  // UPI state
  const [upiAmount, setUpiAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [upiId, setUpiId] = useState('sharktrd@ptaxis');
  const [upiQr, setUpiQr] = useState('');
  const [upiMinDeposit, setUpiMinDeposit] = useState(100);
  const [upiRate, setUpiRate] = useState(95.05);
  const [conversionRates, setConversionRates] = useState<any>({ 
    INR: 0.012,
    depositRates: { INR: 95.05, GBP: 0.8, EUR: 0.9 },
    minDepositUSD: 100,
    bankTiers: [
      { min: 10000, rate: 92.55 },
      { min: 5000, rate: 93.67 },
      { min: 1000, rate: 94.43 },
      { min: 1, rate: 95.05 }
    ],
    upiTiers: [
      { min: 500, rate: 94.43 },
      { min: 1, rate: 95.05 }
    ]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('text, sender')
          .in('sender', ['system_settings', 'system_settings_crypto', 'system_settings_conversion'])
          .order('created_at', { ascending: false });

        if (!error && data) {
          const upiSettings = data.find(d => d.sender === 'system_settings');
          if (upiSettings) {
            const settings = JSON.parse(upiSettings.text);
            if (settings.upiId) setUpiId(settings.upiId);
            if (settings.upiQr) setUpiQr(settings.upiQr);
            if (settings.minDeposit) setUpiMinDeposit(settings.minDeposit);
            if (settings.upiRate) setUpiRate(settings.upiRate);
            
            setBankDetails({
              bankName: settings.bankName || '',
              accountName: settings.accountName || '',
              accountNumber: settings.accountNumber || '',
              ifscCode: settings.ifscCode || '',
              bankBranch: settings.bankBranch || ''
            });
          }

          const cryptoSettings = data.find(d => d.sender === 'system_settings_crypto');
          if (cryptoSettings) {
            const methods = JSON.parse(cryptoSettings.text);
            setCryptoMethods(methods);
            if (methods.length > 0) {
              setCryptoAsset(methods[0].asset);
              setNetwork(methods[0].network);
            }
          }

          const conversionSettings = data.find(d => d.sender === 'system_settings_conversion');
          if (conversionSettings) {
            const rates = JSON.parse(conversionSettings.text);
            setConversionRates((prev: any) => ({ ...prev, ...rates }));
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();

    // Real-time subscription for settings
    const channel = supabase
      .channel('system_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        (payload) => {
          const sender = payload.new ? (payload.new as any).sender : null;
          if (sender && ['system_settings', 'system_settings_crypto', 'system_settings_conversion'].includes(sender)) {
            fetchSettings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, available_balance')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    fetchProfile();
  }, [session.user.id]);

  // Update network when asset changes
  useEffect(() => {
    if (cryptoMethods.length > 0 && cryptoAsset) {
      const availableNetworks = cryptoMethods.filter(m => m.asset === cryptoAsset).map(m => m.network);
      if (availableNetworks.length > 0 && !availableNetworks.includes(network)) {
        setNetwork(availableNetworks[0]);
      }
    }
  }, [cryptoAsset, cryptoMethods]);

  const currentCryptoMethod = cryptoMethods.find(m => m.asset === cryptoAsset && m.network === network);

  const handleCopy = () => {
    if (currentCryptoMethod?.address) {
      navigator.clipboard.writeText(currentCryptoMethod.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCryptoSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: session.user.id,
          type: 'deposit',
          amount: 0, // Pending amount, admin updates it later
          strategy: cryptoAsset,
          currency: cryptoAsset,
          network: network,
          status: 'pending'
        }
      ]);
      if (error) throw error;
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      alert('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConversionRate = (amount: number, type: 'BANK' | 'UPI') => {
    const tiers = type === 'BANK' ? conversionRates.bankTiers : conversionRates.upiTiers;
    if (!tiers || tiers.length === 0) return upiRate;

    // Sort tiers by min amount descending to ensure correct matching
    const sortedTiers = [...tiers].sort((a, b) => b.min - a.min);

    // Find the first tier where amount >= min
    const tier = sortedTiers.find((t: any) => amount >= t.min);
    return tier ? tier.rate : sortedTiers[sortedTiers.length - 1].rate;
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const amountInUsd = Number(upiAmount) / getConversionRate(Number(upiAmount) / upiRate, 'UPI');
      const minInr = upiMinDeposit * upiRate;
      
      if (Number(upiAmount) < minInr) {
        alert(`Minimum deposit amount is ${upiMinDeposit} USDT (₹${minInr.toFixed(0)})`);
        setIsSubmitting(false);
        return;
      }

      if (amountInUsd > 1000) {
        alert('UPI deposit limit is $1,000. For larger amounts, please use Bank Transfer.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: session.user.id,
          type: 'deposit',
          amount: amountInUsd,
          strategy: 'INR',
          currency: 'INR',
          network: 'UPI',
          address: utrNumber,
          notes: `Original Amount: ₹${upiAmount}`,
          status: 'pending'
        }
      ]);
      if (error) throw error;
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      alert('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const minAmount = upiMinDeposit; // Use same min deposit in USD
      const amountInUsd = Number(bankAmount);
      
      if (amountInUsd < minAmount) {
        alert(`Minimum deposit amount is $${minAmount}`);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: session.user.id,
          type: 'deposit',
          amount: amountInUsd,
          strategy: 'BANK',
          currency: 'USD',
          network: 'Bank Transfer',
          status: 'pending',
          address: bankRef // Store reference number in address field
        }
      ]);
      if (error) throw error;
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      alert('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userCountry = session?.user?.user_metadata?.country || '';
  const isIndia = userCountry.toLowerCase().includes('india');

  if (isSuccess) {
    return (
      <DashboardLayout session={session}>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-main mb-4">Deposit Request Submitted</h2>
          <p className="text-muted text-center mb-8">
            Your deposit request has been received. 
            Funds will be credited to your account once verified.
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

        <div className="bg-card border border-main rounded-3xl p-8 md:p-10 shadow-xl">
          <h1 className="text-3xl font-display font-bold text-main mb-2">Deposit Funds</h1>
          <p className="text-muted mb-8">Add funds to your account to start trading.</p>

          {/* Method Selection */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setMethod('CRYPTO')}
              className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-4 rounded-xl border transition-all ${
                method === 'CRYPTO' 
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                : 'bg-muted border-main text-muted hover:bg-main/10'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Crypto</span>
          </button>
          
          <button
            onClick={() => setMethod('BANK')}
            className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-4 rounded-xl border transition-all ${
              method === 'BANK' 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                : 'bg-muted border-main text-muted hover:bg-main/10'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Bank</span>
          </button>

          {isIndia && (
            <button
              onClick={() => setMethod('UPI')}
              className={`flex-1 min-w-[140px] flex items-center justify-center space-x-2 py-4 rounded-xl border transition-all ${
                method === 'UPI' 
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                  : 'bg-muted border-main text-muted hover:bg-main/10'
              }`}
            >
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">UPI</span>
              </button>
            )}
          </div>

          {method === 'CRYPTO' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset Selection */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Select Asset</label>
                  <select 
                    value={cryptoAsset}
                    onChange={(e) => setCryptoAsset(e.target.value)}
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {Array.from(new Set(cryptoMethods.map(m => m.asset))).map(asset => (
                      <option key={asset as string} value={asset as string}>{asset as string}</option>
                    ))}
                  </select>
                </div>

                {/* Network Selection */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Select Network</label>
                  <select 
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {cryptoMethods.filter(m => m.asset === cryptoAsset).map(net => (
                      <option key={net.network} value={net.network}>{net.network}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-muted border border-main rounded-2xl p-6 flex flex-col items-center text-center space-y-6">
                <div className="w-48 h-48 bg-white rounded-xl p-4 flex items-center justify-center overflow-hidden">
                  {/* QR Code Image */}
                  {currentCryptoMethod?.qrCode ? (
                    <img 
                      src={currentCryptoMethod.qrCode} 
                      alt={`QR Code for ${cryptoAsset} on ${network}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted">
                      <QrCode className="w-16 h-16 mb-2 text-black/20" />
                      <span className="text-xs text-black/50 font-medium">QR Code Placeholder</span>
                    </div>
                  )}
                </div>
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-muted mb-2 text-left">Deposit Address</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      readOnly
                      value={currentCryptoMethod?.address || 'Address not available'}
                      className="flex-1 bg-main border border-main rounded-xl px-4 py-3 text-main font-mono text-sm"
                    />
                    <button 
                      onClick={handleCopy}
                      className="bg-muted hover:bg-main/10 p-3 rounded-xl transition-colors text-main border border-main"
                      title="Copy Address"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-left">
                  <h4 className="text-yellow-500 font-medium mb-1 text-sm">Important</h4>
                  <ul className="text-yellow-500/80 text-xs space-y-1 list-disc pl-4">
                    <li>Send only {cryptoAsset} to this deposit address.</li>
                    <li>Ensure the network is {network}.</li>
                    <li>Deposits are automatically credited after network confirmations.</li>
                  </ul>
                </div>

                <button 
                  onClick={handleCryptoSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                >
                  {isSubmitting ? 'Submitting...' : 'I Have Paid'}
                </button>
              </div>
            </div>
          ) : method === 'BANK' ? (
            <form onSubmit={handleBankSubmit} className="space-y-6">
              <div className="bg-muted border border-main rounded-2xl p-6 space-y-4">
                <h4 className="text-main font-bold border-b border-main pb-2">Bank Transfer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted uppercase font-bold">Bank Name</p>
                    <p className="text-main font-medium">{bankDetails.bankName || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase font-bold">Account Name</p>
                    <p className="text-main font-medium">{bankDetails.accountName || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase font-bold">Account Number</p>
                    <p className="text-main font-mono font-medium">{bankDetails.accountNumber || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase font-bold">IFSC / Swift Code</p>
                    <p className="text-main font-mono font-medium">{bankDetails.ifscCode || 'Not Set'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Amount to Deposit (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-muted font-medium">$</span>
                  </div>
                  <input 
                    type="number" 
                    required
                    min={upiMinDeposit}
                    step="0.01"
                    value={bankAmount}
                    onChange={(e) => setBankAmount(e.target.value)}
                    placeholder={upiMinDeposit.toString()}
                    className="w-full bg-main border border-main rounded-xl pl-8 pr-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                {bankAmount && Number(bankAmount) > 0 && (
                  <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Conversion Rate:</span>
                      <span className="text-emerald-500 font-bold">₹{getConversionRate(Number(bankAmount), 'BANK')} / $</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted">You need to pay:</span>
                      <span className="text-main font-bold">₹{(Number(bankAmount) * getConversionRate(Number(bankAmount), 'BANK')).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {/* Bank Tiers Display */}
                <div className="mt-4 p-4 bg-muted/50 border border-main rounded-xl">
                  <p className="text-xs font-bold text-muted uppercase mb-2">Bank Deposit Tiers</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(conversionRates.bankTiers || [
                      { min: 10000, rate: 92.55 },
                      { min: 5000, rate: 93.67 },
                      { min: 1000, rate: 94.43 },
                      { min: 1, rate: 95.05 }
                    ]).map((tier: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs border-b border-main/10 pb-1">
                        <span className="text-muted">${tier.min}+</span>
                        <span className="text-main font-medium">₹{tier.rate}/$</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted mt-2">Minimum deposit: ${upiMinDeposit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Transaction Reference / Receipt ID</label>
                <input 
                  type="text" 
                  required
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="Enter transaction reference number"
                  className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !bankAmount || !bankRef}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-emerald"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Bank Deposit Request'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpiSubmit} className="space-y-6">
              <div className="bg-muted border border-main rounded-2xl p-6 flex flex-col items-center text-center space-y-6">
                <div className="w-48 h-48 bg-white rounded-xl p-4 flex items-center justify-center">
                  {upiQr ? (
                    <img src={upiQr} alt="UPI QR Code" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <QrCode className="w-full h-full text-black" />
                  )}
                </div>
                <div className="text-main font-medium">
                  Scan QR or pay to: <span className="text-emerald-400 font-mono">{upiId}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Amount Sent (INR)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-muted font-medium">₹</span>
                  </div>
                  <input 
                    type="number" 
                    required
                    min={upiMinDeposit * upiRate}
                    step="1"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    placeholder={(upiMinDeposit * upiRate).toString()}
                    className="w-full bg-main border border-main rounded-xl pl-8 pr-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                {upiAmount && Number(upiAmount) > 0 && (
                  <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Conversion Rate:</span>
                      <span className="text-emerald-500 font-bold">₹{getConversionRate(Number(upiAmount) / upiRate, 'UPI')} / $</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted">Estimated received:</span>
                      <span className="text-main font-bold">~{(Number(upiAmount) / getConversionRate(Number(upiAmount) / upiRate, 'UPI')).toFixed(2)} USDT</span>
                    </div>
                  </div>
                )}

                {/* UPI Tiers Display */}
                <div className="mt-4 p-4 bg-muted/50 border border-main rounded-xl">
                  <p className="text-xs font-bold text-muted uppercase mb-2">UPI Deposit Tiers</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(conversionRates.upiTiers || [
                      { min: 500, rate: 94.43 },
                      { min: 1, rate: 95.05 }
                    ]).map((tier: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs border-b border-main/10 pb-1">
                        <span className="text-muted">${tier.min}+</span>
                        <span className="text-main font-medium">₹{tier.rate}/$</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted mt-2">Minimum deposit: {upiMinDeposit} USDT (₹{upiMinDeposit * upiRate})</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">UTR / Reference Number</label>
                <input 
                  type="text" 
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter 12-digit UTR number"
                  className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !upiAmount || !utrNumber}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-emerald"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
