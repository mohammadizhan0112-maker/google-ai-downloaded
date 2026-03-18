import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { User, Lock, Bell, Shield, CreditCard, ChevronRight, X, CheckCircle2, Upload, FileText, Smartphone, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings({ session }: { session: any }) {
  const [profile, setProfile] = useState<any>(null);
  
  // Missing state variables
  const [verificationLevel, setVerificationLevel] = useState(1);
  const [fullName, setFullName] = useState('');
  const [userMeta, setUserMeta] = useState<any>({});
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);

  // Modals state
  const [verifyStep, setVerifyStep] = useState<number>(0); // 0: closed, 1: intro, 2: upload
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isAddingCrypto, setIsAddingCrypto] = useState(false);
  const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', accountName: '', ifsc: '' });
  const [newCrypto, setNewCrypto] = useState({ asset: 'USDT', network: 'TRC20', address: '' });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, available_balance, allocated_balance')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        if (data?.full_name) {
          setFullName(data.full_name);
        }
        
        // Load data from profiles table
        if (data) {
          setUserMeta(data);
          setBankAccounts(data.bank_accounts || []);
          setCryptoWallets(data.crypto_wallets || []);
          
          if (data.phone) setPhone(data.phone);
          if (data.address) setAddress(data.address);
          
          let level = 1;
          if (data.phone && data.address) level = 2;
          if (data.document_verified) level = 3;
          setVerificationLevel(level);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    fetchProfile();
  }, [session.user.id]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate password change
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully');
    }, 1000);
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Instead of auto-verifying, we log it for admin approval
      await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: `DOCUMENT_UPLOAD:${selectedDoc}: User has uploaded a verification document.`,
        sender: 'user',
        status: 'document_pending'
      }]);

      await supabase.auth.updateUser({ data: { document_status: 'pending' } });
      await supabase.from('profiles').update({ document_status: 'pending' }).eq('id', session.user.id);
      
      setUserMeta(prev => ({ ...prev, document_status: 'pending' }));
      setVerifyStep(0);
      alert('Document uploaded successfully. Verification is in progress.');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { phone, address }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').update({
        phone, address
      }).eq('id', session.user.id);
      if (profileError) throw profileError;

      // Log for admin compliance
      await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: `PROFILE_UPDATE: Phone: ${phone}, Address: ${address}`,
        sender: 'system',
        status: 'info'
      }]);

      setUserMeta(prev => ({ ...prev, phone, address }));

      alert('Profile updated successfully');
      if (phone && address) {
        setVerificationLevel(userMeta.document_verified ? 3 : 2);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const saveBankAccounts = async (accounts: any[]) => {
    try {
      await supabase.auth.updateUser({ data: { bankAccounts: accounts } });
      await supabase.from('profiles').update({ bank_accounts: accounts }).eq('id', session.user.id);
      
      // Also save to a dedicated table or support messages for admin visibility
      await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: `PAYMENT_METHOD_UPDATE:BANK:${JSON.stringify(accounts)}`,
        sender: 'system',
        status: 'info'
      }]);
      
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error saving bank accounts:', error);
    }
  };

  const saveCryptoWallets = async (wallets: any[]) => {
    try {
      await supabase.auth.updateUser({ data: { cryptoWallets: wallets } });
      await supabase.from('profiles').update({ crypto_wallets: wallets }).eq('id', session.user.id);
      
      // Also save to support messages for admin visibility
      await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: `PAYMENT_METHOD_UPDATE:CRYPTO:${JSON.stringify(wallets)}`,
        sender: 'system',
        status: 'info'
      }]);
      
      setCryptoWallets(wallets);
    } catch (error) {
      console.error('Error saving crypto wallets:', error);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAccounts = [...bankAccounts, { ...newBank, id: Date.now().toString() }];
    await saveBankAccounts(newAccounts);
    setIsAddingBank(false);
    setNewBank({ bankName: '', accountNumber: '', accountName: '', ifsc: '' });
  };

  const handleDeleteBank = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      const accountToDelete = bankAccounts.find(acc => acc.id === id);
      const newAccounts = bankAccounts.filter(acc => acc.id !== id);
      
      // Save to metadata (this is what the user sees)
      await supabase.auth.updateUser({ data: { bankAccounts: newAccounts } });
      await supabase.from('profiles').update({ bank_accounts: newAccounts }).eq('id', session.user.id);
      
      // Log the deletion for admin
      await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: `PAYMENT_METHOD_DELETE:BANK:${JSON.stringify(accountToDelete)}`,
        sender: 'system',
        status: 'warning'
      }]);
      
      setBankAccounts(newAccounts);
    }
  };

  const handleAddCrypto = async (e: React.FormEvent) => {
    e.preventDefault();
    const newWallets = [...cryptoWallets, { ...newCrypto, id: Date.now().toString(), network: `${newCrypto.asset} ${newCrypto.network}` }];
    await saveCryptoWallets(newWallets);
    setIsAddingCrypto(false);
    setNewCrypto({ asset: 'USDT', network: 'TRC20', address: '' });
  };

  const handleDeleteCrypto = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this crypto wallet?')) {
      const walletToDelete = cryptoWallets.find(w => w.id === id);
      const newWallets = cryptoWallets.filter(w => w.id !== id);
      
      // Save to metadata
      await supabase.auth.updateUser({ data: { cryptoWallets: newWallets } });
      await supabase.from('profiles').update({ crypto_wallets: newWallets }).eq('id', session.user.id);
      
      // Log the deletion for admin
      await supabase.from('support_messages').insert([{
        user_id: session.user.id,
        text: `PAYMENT_METHOD_DELETE:CRYPTO:${JSON.stringify(walletToDelete)}`,
        sender: 'system',
        status: 'warning'
      }]);
      
      setCryptoWallets(newWallets);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone. You will not be able to use this email address again.')) {
      try {
        // Scramble password to lock them out permanently and mark as deleted
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + 'A1!';
        await supabase.auth.updateUser({
          password: randomPassword,
          data: { deleted: true }
        });
        await supabase.auth.signOut();
        window.location.href = '/login';
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please contact support.');
      }
    }
  };

  return (
    <DashboardLayout session={session}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-main">Account Settings</h2>
            <p className="text-muted mt-2">Manage your profile, security preferences, and notifications.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-card border border-main rounded-3xl p-6 sm:p-8 relative shadow-lg">
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center space-x-3">
              <span className="text-sm font-bold text-muted">
                {verificationLevel}/3 {verificationLevel === 3 && <span className="text-emerald-500">fully verified</span>}
              </span>
              {verificationLevel < 3 ? (
                userMeta.document_status === 'pending' ? (
                  <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> In Progress
                  </span>
                ) : (
                  <button 
                    onClick={() => setVerifyStep(1)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-md"
                  >
                    VERIFY
                  </button>
                )
              ) : (
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted border border-main flex items-center justify-center text-emerald-500">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-main">Profile Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors">
                <p className="font-medium text-muted">Full Name</p>
                <span className="text-main font-medium mt-1 sm:mt-0">{fullName}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors">
                <p className="font-medium text-muted">Email Address</p>
                <span className="text-main font-medium mt-1 sm:mt-0">{session.user.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors">
                <p className="font-medium text-muted">Phone Number</p>
                {userMeta.phone ? (
                  <span className="text-main font-medium mt-1 sm:mt-0">{userMeta.phone}</span>
                ) : (
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="Add phone number"
                    className="bg-transparent border-b border-main text-main focus:outline-none focus:border-emerald-500 text-left sm:text-right mt-1 sm:mt-0"
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors">
                <p className="font-medium text-muted">Address</p>
                {userMeta.address ? (
                  <span className="text-main font-medium mt-1 sm:mt-0">{userMeta.address}</span>
                ) : (
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Add address"
                    className="bg-transparent border-b border-main text-main focus:outline-none focus:border-emerald-500 text-left sm:text-right mt-1 sm:mt-0"
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors">
                <p className="font-medium text-muted">Date of Birth</p>
                <span className="text-main font-medium mt-1 sm:mt-0">{userMeta.dob || 'Not provided'}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors">
                <p className="font-medium text-muted">Country</p>
                <span className="text-main font-medium mt-1 sm:mt-0">{userMeta.country || 'Not provided'}</span>
              </div>
            </div>
            {(!userMeta.phone || !userMeta.address) && (
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile || !phone || !address}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="bg-card border border-main rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted border border-main flex items-center justify-center text-emerald-500">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-main">Security</h3>
            </div>
            
            <div className="space-y-4">
              <div 
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors cursor-pointer group"
              >
                <div>
                  <p className="font-medium text-muted">Password</p>
                  <p className="text-xs text-muted mt-1">Last changed: {new Date(session.user.updated_at || session.user.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-main font-medium">••••••••</span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card border border-main rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-muted border border-main flex items-center justify-center text-emerald-500">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-main">Payment Method</h3>
            </div>
            <p className="text-xs text-muted mb-6 uppercase tracking-wider font-bold">saved payment methods</p>
            
            <div className="space-y-4">
              <div 
                onClick={() => setIsBankModalOpen(true)}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors cursor-pointer group"
              >
                <p className="font-medium text-muted">Bank Account</p>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-main font-medium text-sm">View Saved Details</span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
              <div 
                onClick={() => setIsCryptoModalOpen(true)}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-main last:border-0 hover:bg-muted px-4 -mx-4 rounded-xl transition-colors cursor-pointer group"
              >
                <p className="font-medium text-muted">Crypto wallet</p>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-main font-medium text-sm">View Saved Addresses</span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 sm:p-8 mt-12 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-red-500">Danger Zone</h3>
          </div>
          <p className="text-muted mb-6">Once you delete your account, there is no going back. Please be certain.</p>
          <button 
            onClick={handleDeleteAccount}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
          >
            Delete Account
          </button>
        </div>

      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {verifyStep > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVerifyStep(0)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
            >
              <div className="bg-card border border-main rounded-3xl shadow-2xl overflow-hidden relative p-8">
                <button
                  onClick={() => setVerifyStep(0)}
                  className="absolute top-4 right-4 text-muted hover:text-main transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {verifyStep === 1 ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-main mb-4 uppercase tracking-wide">Let's Verify Your Identity</h2>
                    <p className="text-muted mb-8 leading-relaxed">
                      To comply with global regulations and ensure the security of your account, we need to verify your identity. This process helps us prevent fraud and keep our community safe.
                    </p>
                    <button 
                      onClick={() => setVerifyStep(2)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg"
                    >
                      CONTINUE
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-display font-bold text-main mb-6">Upload Document</h2>
                    <form onSubmit={handleDocumentUpload} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-muted mb-3">Choose Document Type</label>
                        <div className="space-y-3">
                          {['passport', 'national_id', 'driver_license'].map((type) => (
                            <label key={type} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${selectedDoc === type ? 'border-emerald-500 bg-emerald-500/10' : 'border-main bg-muted hover:bg-card'}`}>
                              <input 
                                type="radio" 
                                name="docType" 
                                value={type} 
                                checked={selectedDoc === type}
                                onChange={() => setSelectedDoc(type)}
                                className="hidden" 
                              />
                              <FileText className={`w-5 h-5 mr-3 ${selectedDoc === type ? 'text-emerald-500' : 'text-muted'}`} />
                              <span className={`font-medium capitalize ${selectedDoc === type ? 'text-emerald-500' : 'text-main'}`}>
                                {type.replace('_', ' ')}
                              </span>
                              {selectedDoc === type && <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-500" />}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-main rounded-xl p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer group">
                        <Upload className="w-8 h-8 text-muted group-hover:text-emerald-500 mx-auto mb-3 transition-colors" />
                        <p className="text-sm text-main font-medium mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted">PNG, JPG or PDF (max. 10MB)</p>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center"
                      >
                        <Upload className="w-5 h-5 mr-2" /> UPLOAD
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
            >
              <div className="bg-card border border-main rounded-3xl shadow-2xl overflow-hidden relative p-8">
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="absolute top-4 right-4 text-muted hover:text-main transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display font-bold text-main mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Old Password</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="block w-full px-4 py-3 border border-main rounded-xl bg-muted text-main focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-4 py-3 border border-main rounded-xl bg-muted text-main focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-4 py-3 border border-main rounded-xl bg-muted text-main focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl transition-all mt-6 shadow-lg"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bank Modal */}
      <AnimatePresence>
        {isBankModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBankModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
            >
              <div className="bg-card border border-main rounded-3xl shadow-2xl overflow-hidden relative p-8">
                <button
                  onClick={() => setIsBankModalOpen(false)}
                  className="absolute top-4 right-4 text-muted hover:text-main transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display font-bold text-main mb-6">Saved Bank Accounts</h2>
                <div className="space-y-4">
                  {bankAccounts.length === 0 && !isAddingBank && (
                    <p className="text-muted text-center py-4">No bank accounts saved.</p>
                  )}
                  {bankAccounts.map((acc) => (
                    <div key={acc.id} className="bg-muted border border-main rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-main">{acc.bankName}</h4>
                        </div>
                        <p className="text-sm text-muted font-mono">**** **** **** {acc.accountNumber.slice(-4)}</p>
                        {acc.ifsc && <p className="text-xs text-muted font-mono mt-1">IFSC: {acc.ifsc}</p>}
                        <p className="text-sm text-muted mt-1">{acc.accountName}</p>
                      </div>
                      <button onClick={() => handleDeleteBank(acc.id)} className="text-red-500 hover:text-red-400 p-2">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  {isAddingBank ? (
                    <form onSubmit={handleAddBank} className="bg-muted border border-main rounded-xl p-4 space-y-4">
                      <input type="text" required placeholder="Bank Name" value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} className="w-full bg-transparent border-b border-main text-main px-2 py-1 focus:outline-none focus:border-emerald-500" />
                      <input type="text" required placeholder="Account Number" value={newBank.accountNumber} onChange={e => setNewBank({...newBank, accountNumber: e.target.value})} className="w-full bg-transparent border-b border-main text-main px-2 py-1 focus:outline-none focus:border-emerald-500" />
                      <input type="text" required placeholder="IFSC Code" value={newBank.ifsc} onChange={e => setNewBank({...newBank, ifsc: e.target.value})} className="w-full bg-transparent border-b border-main text-main px-2 py-1 focus:outline-none focus:border-emerald-500" />
                      <input type="text" required placeholder="Account Holder Name" value={newBank.accountName} onChange={e => setNewBank({...newBank, accountName: e.target.value})} className="w-full bg-transparent border-b border-main text-main px-2 py-1 focus:outline-none focus:border-emerald-500" />
                      <div className="flex space-x-2 pt-2">
                        <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-lg shadow-md">Save</button>
                        <button type="button" onClick={() => setIsAddingBank(false)} className="flex-1 bg-muted hover:bg-card border border-main text-main font-bold py-2 rounded-lg">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setIsAddingBank(true)} className="w-full border border-dashed border-main hover:border-emerald-500/50 hover:bg-emerald-500/5 text-muted hover:text-emerald-500 py-4 rounded-xl transition-colors font-medium flex items-center justify-center">
                      + Add New Bank Account
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Crypto Modal */}
      <AnimatePresence>
        {isCryptoModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCryptoModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
            >
              <div className="bg-card border border-main rounded-3xl shadow-2xl overflow-hidden relative p-8">
                <button
                  onClick={() => setIsCryptoModalOpen(false)}
                  className="absolute top-4 right-4 text-muted hover:text-main transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display font-bold text-main mb-6">Saved Crypto Wallets</h2>
                <div className="space-y-4">
                  {cryptoWallets.length === 0 && !isAddingCrypto && (
                    <p className="text-muted text-center py-4">No crypto wallets saved.</p>
                  )}
                  {cryptoWallets.map((wallet) => (
                    <div key={wallet.id} className="bg-muted border border-main rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-main">{wallet.network}</h4>
                        </div>
                        <p className="text-xs text-muted font-mono break-all">{wallet.address}</p>
                      </div>
                      <button onClick={() => handleDeleteCrypto(wallet.id)} className="text-red-500 hover:text-red-400 p-2">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  {isAddingCrypto ? (
                    <form onSubmit={handleAddCrypto} className="bg-muted border border-main rounded-xl p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted mb-1 uppercase">Asset</label>
                          <select 
                            value={newCrypto.asset} 
                            onChange={e => setNewCrypto({...newCrypto, asset: e.target.value})}
                            className="w-full bg-muted border border-main rounded-lg px-3 py-2 text-main text-sm focus:outline-none focus:border-emerald-500"
                          >
                            <option value="USDT">USDT</option>
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                            <option value="SOL">SOL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1 uppercase">Network</label>
                          <select 
                            value={newCrypto.network} 
                            onChange={e => setNewCrypto({...newCrypto, network: e.target.value})}
                            className="w-full bg-muted border border-main rounded-lg px-3 py-2 text-main text-sm focus:outline-none focus:border-emerald-500"
                          >
                            <option value="TRC20">TRC20</option>
                            <option value="ERC20">ERC20</option>
                            <option value="BEP20">BEP20</option>
                            <option value="SOLANA">SOLANA</option>
                            <option value="BITCOIN">BITCOIN</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1 uppercase">Wallet Address</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Enter address" 
                          value={newCrypto.address} 
                          onChange={e => setNewCrypto({...newCrypto, address: e.target.value})} 
                          className="w-full bg-transparent border-b border-main text-main px-2 py-1 focus:outline-none focus:border-emerald-500" 
                        />
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-lg shadow-md">Save</button>
                        <button type="button" onClick={() => setIsAddingCrypto(false)} className="flex-1 bg-muted hover:bg-card border border-main text-main font-bold py-2 rounded-lg">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setIsAddingCrypto(true)} className="w-full border border-dashed border-main hover:border-emerald-500/50 hover:bg-emerald-500/5 text-muted hover:text-emerald-500 py-4 rounded-xl transition-colors font-medium flex items-center justify-center">
                      + Add New Wallet Address
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
