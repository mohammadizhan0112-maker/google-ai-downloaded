import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, CreditCard, Building, Smartphone, CheckCircle2, DollarSign, PoundSterling, Wallet, Zap } from 'lucide-react';

export default function SellCrypto({ session }: { session: any }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [method, setMethod] = useState('ACH');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [verificationLevel, setVerificationLevel] = useState(1);
  const [conversionRates, setConversionRates] = useState<any>({
    USDT: 1,
    BTC: 65000,
    ETH: 3500,
    SOL: 150,
    INR: 0.012,
    GBP: 1.25,
    EUR: 1.08,
    USD: 1,
    PAYPAL: 1,
    withdrawalRates: { INR: 83, GBP: 0.82, EUR: 0.92 }
  });

  // Form fields based on method
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState('Checking');
  const [sortCode, setSortCode] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');

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
        if (data?.full_name) {
          setRecipientName(data.full_name);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          setBankAccounts(user.user_metadata.bankAccounts || []);
          
          let level = 1;
          if (user.user_metadata.phone && user.user_metadata.address) level = 2;
          if (user.user_metadata.document_verified) level = 3;
          setVerificationLevel(level);
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_conversion')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!settingsError && settingsData && settingsData.length > 0) {
          const parsedRates = JSON.parse(settingsData[0].text);
          if (parsedRates && typeof parsedRates === 'object') {
            setConversionRates(prev => ({ ...prev, ...parsedRates }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    fetchProfile();
  }, [session.user.id]);

  // Update default method when fiat currency changes
  useEffect(() => {
    if (fiatCurrency === 'USD') setMethod('ACH');
    else if (fiatCurrency === 'GBP') setMethod('FASTER_PAYMENTS');
    else if (fiatCurrency === 'INR') setMethod('BANK_TRANSFER');
    else if (fiatCurrency === 'PAYPAL') setMethod('PAYPAL');
  }, [fiatCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (verificationLevel < 2) {
        alert('You need to have at least 2/3 verification to sell crypto. Please complete your profile details in Settings.');
        setIsSubmitting(false);
        return;
      }

      // Save bank account if it's new
      if (['ACH', 'WIRE', 'FASTER_PAYMENTS', 'BACS_CHAPS', 'BANK_TRANSFER', 'IMPS'].includes(method)) {
        const isExisting = bankAccounts.some(acc => acc.accountNumber === accountNumber);
        if (!isExisting) {
          const newBank = {
            id: Date.now().toString(),
            bankName: bankName || method.replace('_', ' '),
            accountNumber,
            accountName: recipientName,
          };
          const newAccounts = [...bankAccounts, newBank];
          await supabase.auth.updateUser({ data: { bankAccounts: newAccounts } });
          setBankAccounts(newAccounts);
        }
      }

      // Call RPC to handle withdrawal and balance deduction atomically
      const { data: rpcData, error: txError } = await supabase.rpc('request_withdrawal', {
        user_id: session.user.id,
        amount: usdValue,
        strategy: method
      });

      if (txError) {
        alert(`Withdrawal failed: ${txError.message}`);
        throw txError;
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setIsSubmitting(false);
    }
  };

  const cryptoAmount = parseFloat(amount) || 0;
  const usdValue = cryptoAmount * (conversionRates[cryptoCurrency] || 1);
  const fiatValue = fiatCurrency === 'USD' || fiatCurrency === 'PAYPAL' 
    ? usdValue 
    : fiatCurrency === 'GBP' 
      ? usdValue * (conversionRates?.withdrawalRates?.GBP || (1 / (conversionRates.GBP || 1.25)))
      : fiatCurrency === 'INR'
        ? usdValue * (conversionRates?.withdrawalRates?.INR || (1 / (conversionRates.INR || 0.012)))
        : usdValue * (conversionRates?.withdrawalRates?.[fiatCurrency] || (1 / (conversionRates[fiatCurrency] || 1)));

  const formatFiat = (val: number, currency: string) => {
    if (currency === 'USD' || currency === 'PAYPAL') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    if (currency === 'GBP') return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
    if (currency === 'INR') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    return val.toFixed(2);
  };

  if (isSuccess) {
    return (
      <DashboardLayout session={session}>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-main mb-4">Request Submitted</h2>
          <p className="text-muted text-center mb-8">
            Your request to sell {amount} {cryptoCurrency} for {formatFiat(fiatValue, fiatCurrency)} via {method.replace('_', ' ')} has been received. 
            Funds will be transferred to {recipientName} shortly.
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
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-muted hover:text-main flex items-center space-x-2 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-card border border-main rounded-3xl p-8 md:p-10">
          <h1 className="text-3xl font-display font-bold text-main mb-2">Sell Crypto</h1>
          <p className="text-muted mb-8">Convert your crypto assets to fiat currency.</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Crypto Selection */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Crypto to Sell</label>
                <select 
                  value={cryptoCurrency}
                  onChange={(e) => setCryptoCurrency(e.target.value)}
                  className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="USDT">USDT (Tether)</option>
                  <option value="BTC">BTC (Bitcoin)</option>
                  <option value="ETH">ETH (Ethereum)</option>
                  <option value="SOL">SOL (Solana)</option>
                </select>
              </div>

              {/* Fiat Selection */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Receive Fiat</label>
                <select 
                  value={fiatCurrency}
                  onChange={(e) => setFiatCurrency(e.target.value)}
                  className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="USD">USD (US Dollar)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="INR">INR (Indian Rupee)</option>
                  <option value="PAYPAL">PayPal (USD)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-muted">Amount to Sell</label>
                  {profile && (
                    <span className="text-xs text-muted">
                      Available: {((profile.available_balance || 0) / conversionRates[cryptoCurrency]).toFixed(6)} {cryptoCurrency}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    min="0"
                    max={profile ? ((profile.available_balance || 0) / conversionRates[cryptoCurrency]) : undefined}
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-main border border-main rounded-xl pl-4 pr-32 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-3">
                    <button 
                      type="button"
                      onClick={() => {
                        if (profile) {
                          setAmount(((profile.available_balance || 0) / conversionRates[cryptoCurrency]).toFixed(6));
                        }
                      }}
                      className="text-xs font-bold text-emerald-500 hover:text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-md transition-colors"
                    >
                      MAX
                    </button>
                    <span className="text-muted font-medium">
                      {cryptoCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conversion Preview */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">You Will Receive (Estimated)</label>
                <div className="w-full bg-main border border-main rounded-xl px-4 py-3 text-emerald-400 font-bold flex justify-between items-center">
                  <span>{formatFiat(fiatValue, fiatCurrency)}</span>
                  <span className="text-xs text-muted font-normal">
                    1 {cryptoCurrency} = {formatFiat(conversionRates[cryptoCurrency] * (fiatCurrency === 'USD' || fiatCurrency === 'PAYPAL' ? 1 : (conversionRates?.withdrawalRates?.[fiatCurrency] || (1 / (conversionRates[fiatCurrency] || 1)))), fiatCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Method Selection */}
            <div>
              <label className="block text-sm font-medium text-muted mb-4">Withdrawal Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fiatCurrency === 'USD' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMethod('ACH')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        method === 'ACH' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                      }`}
                    >
                      <Building className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">ACH Transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('WIRE')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        method === 'WIRE' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                      }`}
                    >
                      <Building className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Wire Transfer</span>
                    </button>
                  </>
                )}

                {fiatCurrency === 'GBP' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMethod('FASTER_PAYMENTS')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        method === 'FASTER_PAYMENTS' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                      }`}
                    >
                      <Zap className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Faster Payments</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('BACS_CHAPS')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        method === 'BACS_CHAPS' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                      }`}
                    >
                      <Building className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">BACS / CHAPS</span>
                    </button>
                  </>
                )}

                {fiatCurrency === 'INR' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMethod('BANK_TRANSFER')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        method === 'BANK_TRANSFER' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                      }`}
                    >
                      <Building className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Bank Transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('IMPS')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        method === 'IMPS' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">IMPS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('UPI')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        method === 'UPI' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                      }`}
                    >
                      <Smartphone className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">UPI</span>
                    </button>
                  </>
                )}

                {fiatCurrency === 'PAYPAL' && (
                  <button
                    type="button"
                    onClick={() => setMethod('PAYPAL')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      method === 'PAYPAL' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted border-main text-muted hover:bg-hover'
                    }`}
                  >
                    <Wallet className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">PayPal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Saved Bank Accounts Dropdown */}
            {bankAccounts.length > 0 && ['ACH', 'WIRE', 'FASTER_PAYMENTS', 'BACS_CHAPS', 'BANK_TRANSFER', 'IMPS'].includes(method) && (
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Select Saved Bank Account</label>
                <select
                  className="w-full bg-main border border-main rounded-xl px-4 py-3 text-emerald-500 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  onChange={(e) => {
                    if (e.target.value) {
                      const acc = bankAccounts.find(a => a.id === e.target.value);
                      if (acc) {
                        setAccountNumber(acc.accountNumber);
                        if (acc.accountName) setRecipientName(acc.accountName);
                        if (acc.ifsc) setIfscCode(acc.ifsc);
                        if (acc.bankName) setBankName(acc.bankName);
                      }
                    } else {
                      setAccountNumber('');
                      setIfscCode('');
                      setBankName('');
                    }
                  }}
                >
                  <option value="">-- Enter new account details below --</option>
                  {bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - ****{acc.accountNumber.slice(-4)} ({acc.accountName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient Details */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Name of the Recipient</label>
              <input 
                type="text" 
                required
                value={recipientName} 
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient's full name"
                className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-xs text-muted mt-2">Please ensure the name matches the bank account details exactly.</p>
            </div>

            {/* Dynamic Fields based on Method */}
            <div className="bg-muted border border-main rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-main mb-4">
                {method.replace('_', ' ')} Details
              </h3>
              
              {/* USD Methods */}
              {(method === 'ACH' || method === 'WIRE') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Routing Number (ABA)</label>
                    <input 
                      type="text" 
                      required
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="Enter 9-digit routing number"
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Account Number</label>
                    <input 
                      type="text" 
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Account Type</label>
                    <select 
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                    >
                      <option value="Checking">Checking</option>
                      <option value="Savings">Savings</option>
                    </select>
                  </div>
                </>
              )}

              {/* GBP Methods */}
              {(method === 'FASTER_PAYMENTS' || method === 'BACS_CHAPS') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Sort Code</label>
                    <input 
                      type="text" 
                      required
                      value={sortCode}
                      onChange={(e) => setSortCode(e.target.value)}
                      placeholder="XX-XX-XX"
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Account Number</label>
                    <input 
                      type="text" 
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter 8-digit account number"
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </>
              )}

              {/* INR Methods */}
              {(method === 'BANK_TRANSFER' || method === 'IMPS') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Account Number</label>
                    <input 
                      type="text" 
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">IFSC Code</label>
                    <input 
                      type="text" 
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="Enter IFSC code"
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors uppercase"
                    />
                  </div>
                  {method === 'BANK_TRANSFER' && (
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Bank Name</label>
                      <input 
                        type="text" 
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter bank name"
                        className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  )}
                </>
              )}

              {method === 'UPI' && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">UPI ID</label>
                  <input 
                    type="text" 
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              {/* PAYPAL Method */}
              {method === 'PAYPAL' && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">PayPal Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="Enter PayPal email"
                    className="w-full bg-main border border-main rounded-xl px-4 py-3 text-main focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            >
              {isSubmitting ? 'Processing...' : `Sell ${amount || '0'} ${cryptoCurrency} for ${formatFiat(fiatValue, fiatCurrency)}`}
            </button>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
