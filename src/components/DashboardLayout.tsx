import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';
import { 
  LogOut, Wallet, Activity, ArrowUpRight, ArrowDownRight, 
  Settings, LayoutDashboard, PieChart, Bell, Zap, ChevronDown, 
  CandlestickChart, Headset, Users, Sun, Moon
} from 'lucide-react';
import { useCurrency, Currency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import LiveSupport from './LiveSupport';
import Footer from './Footer';
import CompleteProfileModal from './CompleteProfileModal';
import NotificationDropdown from './NotificationDropdown';

interface Profile {
  full_name: string;
  available_balance: number;
  allocated_balance: number;
  dob?: string;
  country?: string;
}

export default function DashboardLayout({ children, session }: { children: React.ReactNode, session: any }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationLevel, setVerificationLevel] = useState(1);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const ADMIN_EMAILS = ['kffatima44@gmail.com', 'mohammadizhan0112@gmail.com', 'wajiuddin65@gmail.com'];

  useEffect(() => {
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      setIsAdmin(true);
    }
  }, [session]);

  const fetchProfileData = async () => {
    if (!session?.user?.id) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, available_balance, allocated_balance, dob, country')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!profileData || !profileData.dob || !profileData.country) {
        // Check if user metadata says it's completed (sometimes DB is slow)
        if (!session.user.user_metadata?.profile_completed) {
          setShowCompleteProfile(true);
        }
      }

      setProfile(profileData);

      // Check verification level from profiles table
      const { data: profileExtended, error: profileExtendedError } = await supabase
        .from('profiles')
        .select('phone, address, document_verified, document_status')
        .eq('id', session.user.id)
        .single();

      if (!profileExtendedError && profileExtended) {
        let level = 1;
        if (profileExtended.phone && profileExtended.address) level = 2;
        if (profileExtended.document_verified) level = 3;
        setVerificationLevel(level);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [session.user.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Strategies', path: '/strategies', icon: Zap },
    { name: 'History', path: '/history', icon: Activity },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/portfolio') return 'Portfolio';
    if (path === '/strategies') return 'Strategies';
    if (path === '/history') return 'History';
    if (path === '/settings') return 'Settings';
    if (path === '/admin') return 'Admin Panel';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-main text-main font-sans overflow-hidden selection:bg-emerald-500/30">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-main bg-card flex flex-col hidden md:flex">
        <div className="h-20 flex items-center px-8 border-b border-main">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <Logo iconSize="md" />
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name}
                to={item.path} 
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative group ${
                  isActive 
                    ? 'bg-emerald-500/10 text-main border border-emerald-500/20 shadow-glow-emerald' 
                    : 'text-muted hover:text-main hover:bg-muted'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-500' : 'group-hover:text-emerald-400'}`} />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full shadow-glow-emerald"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-main">
          {isAdmin && (
            <Link 
              to="/admin" 
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                location.pathname === '/admin'
                  ? 'bg-muted text-main border border-main'
                  : 'text-muted hover:text-main hover:bg-muted'
              }`}
            >
              <Users className={`w-5 h-5 ${location.pathname === '/admin' ? 'text-emerald-500' : ''}`} />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
          <Link 
            to="/settings" 
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === '/settings'
                ? 'bg-muted text-main border border-main'
                : 'text-muted hover:text-main hover:bg-muted'
            }`}
          >
            <Settings className={`w-5 h-5 ${location.pathname === '/settings' ? 'text-emerald-500' : ''}`} />
            <span className="font-medium">Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-20 border-b border-main glass-card flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-display font-bold text-main tracking-tight">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-muted border border-main rounded-xl px-3 py-1.5 hover:bg-muted/80 hover:border-emerald-500/30 transition-all cursor-pointer shadow-sm hover:shadow-glow-emerald">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{currency}</span>
                <ChevronDown className="w-3 h-3 text-muted group-hover:text-main transition-colors" />
              </div>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                <option value="USD" className="bg-card">USD - US Dollar</option>
                <option value="EUR" className="bg-card">EUR - Euro</option>
                <option value="GBP" className="bg-card">GBP - British Pound</option>
                <option value="INR" className="bg-card">INR - Indian Rupee</option>
              </select>
            </div>
            
            <button
              onClick={toggleTheme}
              className="text-muted hover:text-main transition-colors p-2 hover:bg-muted rounded-xl"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <NotificationDropdown userId={session.user.id} />

            <div className="h-8 w-px bg-border-main mx-2"></div>
            
            {/* Top Right Toggle Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-3 hover:bg-muted p-1.5 rounded-xl transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-main leading-tight">{profile?.full_name || session.user.email.split('@')[0]}</p>
                  {verificationLevel === 3 ? (
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Verified Member</p>
                  ) : (
                    <Link to="/settings" className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider hover:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 transition-colors">Complete Profile</Link>
                  )}
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm sm:text-base no-invert">
                  {(profile?.full_name || session.user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

                  {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-card border border-main rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-main">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center"><CandlestickChart className="w-3 h-3 mr-1"/> Trading</p>
                    <Link to="/portfolio" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors">Performance</Link>
                    <Link to="/trade-history" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors">History of trades</Link>
                  </div>
                  <div className="px-4 py-2 border-b border-main">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center"><Wallet className="w-3 h-3 mr-1"/> Payment & Wallet</p>
                    <Link to="/deposit" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors">Deposit</Link>
                    <Link to="/withdraw" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors">Withdrawal</Link>
                    <Link to="/sell" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors">Sell Crypto</Link>
                    <Link to="/history" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors">Transaction history</Link>
                  </div>
                  <div className="px-4 py-2 border-b border-main">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center"><Users className="w-3 h-3 mr-1"/> Referrals</p>
                    <Link to="/referral" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors flex justify-between items-center">
                      <span>Referral Earnings</span>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">New</span>
                    </Link>
                  </div>
                  <div className="px-4 py-2 border-b border-main">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center"><Headset className="w-3 h-3 mr-1"/> Support Hub</p>
                    <Link to="/support" className="block px-2 py-1.5 text-sm text-muted hover:text-main hover:bg-muted rounded-lg transition-colors">Live support</Link>
                  </div>
                  <div className="px-4 py-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 sm:pb-8 custom-scrollbar bg-main">
          {children}
          <div className="mt-12">
            <Footer />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-main px-2 py-3 flex justify-around items-center z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          {[...navItems, { name: 'Settings', path: '/settings', icon: Settings }].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name}
                to={item.path} 
                className={`flex flex-col items-center justify-center flex-1 max-w-[64px] h-14 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/20' 
                    : 'text-muted hover:text-main hover:bg-muted'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''}`} />
                <span className="text-[10px] font-medium mt-1 truncate w-full text-center px-1">{item.name}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link 
              to="/admin" 
              className={`flex flex-col items-center justify-center flex-1 max-w-[64px] h-14 rounded-2xl transition-all duration-300 ${
                location.pathname === '/admin' 
                  ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/20' 
                  : 'text-muted hover:text-main hover:bg-muted'
              }`}
            >
              <Users className={`w-5 h-5 ${location.pathname === '/admin' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''}`} />
              <span className="text-[10px] font-medium mt-1 truncate w-full text-center px-1">Admin</span>
            </Link>
          )}
        </div>
        <div className="hidden md:block">
          <LiveSupport />
        </div>
        <CompleteProfileModal 
          isOpen={showCompleteProfile} 
          session={session} 
          onComplete={() => {
            setShowCompleteProfile(false);
            fetchProfileData();
          }} 
        />
      </main>
    </div>
  );
}
