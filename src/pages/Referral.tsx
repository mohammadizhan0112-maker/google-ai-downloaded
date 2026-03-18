import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Users, Copy, CheckCircle2, Gift, TrendingUp, DollarSign, Info } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Referral({ session }: { session: any }) {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0
  });

  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      try {
        // Fetch current user's profile for referral code and balance
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          setReferralCode(profileData.referral_code || 'REF-' + session.user.id.substring(0, 8).toUpperCase());
        }

        // Fetch referred users
        const { data: referredUsers } = await supabase
          .from('profiles')
          .select('*')
          .eq('referred_by', session.user.id);
        
        if (referredUsers) {
          setReferrals(referredUsers);
          setStats({
            totalReferrals: referredUsers.length,
            activeReferrals: referredUsers.filter(u => (u.available_balance || 0) > 0 || (u.allocated_balance || 0) > 0).length,
            totalEarned: profileData?.referral_balance || 0
          });
        }
      } catch (err) {
        console.error('Error fetching referral data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout session={session}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-card border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
              <Gift className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 text-main">
              Invite Friends, <span className="text-emerald-500">Earn Rewards</span>
            </h1>
            <p className="text-muted text-lg max-w-2xl mb-8">
              Share your unique referral code with friends. When they sign up and start trading, you earn 1% of every deposit they make.
            </p>

            <div className="bg-muted border border-main rounded-2xl p-6 max-w-md">
              <label className="block text-sm font-medium text-muted mb-2 uppercase tracking-wider">Your Unique Referral Code</label>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-card border border-main rounded-xl px-4 py-3 font-mono text-xl font-bold text-main tracking-wider shadow-inner">
                  {referralCode}
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white p-3 rounded-xl transition-colors flex-shrink-0 shadow-lg"
                >
                  {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-main rounded-2xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-muted font-medium">Total Referrals</h3>
            </div>
            <p className="text-3xl font-bold text-main">{stats.totalReferrals}</p>
          </div>
          
          <div className="bg-card border border-main rounded-2xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-muted font-medium">Active Traders</h3>
            </div>
            <p className="text-3xl font-bold text-main">{stats.activeReferrals}</p>
          </div>
          
          <div className="bg-card border border-main rounded-2xl p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-muted font-medium">Total Earned</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-500">${stats.totalEarned.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-card border border-main rounded-3xl p-8 shadow-lg">
          <h2 className="text-xl font-display font-bold mb-6 text-main">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-muted border border-main flex items-center justify-center text-emerald-500 font-bold mb-4">1</div>
              <h3 className="font-bold text-main mb-2">Share your code</h3>
              <p className="text-sm text-muted">Send your unique referral code to friends, family, or followers.</p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-muted border border-main flex items-center justify-center text-emerald-500 font-bold mb-4">2</div>
              <h3 className="font-bold text-main mb-2">They sign up</h3>
              <p className="text-sm text-muted">Your friends use your code during the registration process.</p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold mb-4">3</div>
              <h3 className="font-bold text-main mb-2">You earn</h3>
              <p className="text-sm text-muted">When they make their first deposit, you start receiving their 1% of every deposit.</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-main rounded-3xl p-8 shadow-lg">
          <h2 className="text-xl font-display font-bold mb-6 text-main">Your Referrals</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-muted text-sm border-b border-main">
                    <th className="pb-4 font-medium">User</th>
                    <th className="pb-4 font-medium">Joined</th>
                    <th className="pb-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-main">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="group">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted">
                            {ref.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-main font-medium">{ref.full_name || 'Anonymous User'}</p>
                            <p className="text-xs text-muted">{ref.email?.replace(/(.{3}).*(@.*)/, '$1***$2')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-muted">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${(ref.available_balance > 0 || ref.allocated_balance > 0) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted'}`}>
                          {(ref.available_balance > 0 || ref.allocated_balance > 0) ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted rounded-2xl border border-dashed border-main">
              <Users className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted">You haven't referred anyone yet.</p>
              <p className="text-sm text-muted mt-1">Share your code to start earning!</p>
            </div>
          )}
        </div>

        <div className="bg-card border border-main rounded-3xl p-8 shadow-lg">
          <h2 className="text-xl font-display font-bold mb-6 text-main">Withdrawal Rules</h2>
          <div className="flex items-start space-x-4 bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
            <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-main font-bold mb-2">Minimum Withdrawal: $100.00</h4>
              <p className="text-sm text-muted leading-relaxed">
                Referral bonuses are added to your overall balance but can only be withdrawn once your referral earnings reach a minimum of $100.00. This is to ensure the security and integrity of our referral program.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
