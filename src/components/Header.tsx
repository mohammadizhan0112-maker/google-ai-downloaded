import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Menu, X, User, LogOut, Settings, ChevronDown, LayoutDashboard, Shield } from 'lucide-react';
import AuthModal from './AuthModal';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import Logo from './Logo';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      openAuth(customEvent.detail?.mode || 'signup');
    };
    window.addEventListener('open-auth', handleOpenAuth);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('open-auth', handleOpenAuth);
    };
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-main shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <Logo iconSize="md" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => session ? navigate('/withdraw') : openAuth('login')} 
                className="text-muted hover:text-emerald-400 transition-all duration-300 hover:-translate-y-1 text-sm font-medium"
              >
                Withdraw
              </button>
              <Link to="/markets" className="text-muted hover:text-emerald-400 transition-all duration-300 hover:-translate-y-1 text-sm font-medium">Markets</Link>
              <Link to="/dashboard" className="text-muted hover:text-emerald-400 transition-all duration-300 hover:-translate-y-1 text-sm font-medium">Earn</Link>
              <Link to="/faqs" className="text-muted hover:text-emerald-400 transition-all duration-300 hover:-translate-y-1 text-sm font-medium">FAQs</Link>
              
              <div className="relative group">
                <button className="flex items-center space-x-1 text-muted hover:text-emerald-400 transition-all duration-300 hover:-translate-y-1 text-sm font-medium">
                  <span>More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-40 bg-card border border-main rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/support" className="block px-4 py-2 text-sm text-muted hover:text-main hover:bg-muted">Support</Link>
                  <Link to="/blog" className="block px-4 py-2 text-sm text-muted hover:text-main hover:bg-muted">Blog</Link>
                </div>
              </div>
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-3 md:space-x-6">
              <button className="hidden md:block text-muted hover:text-emerald-400 transition-all duration-300 hover:scale-125">
                <Search className="w-5 h-5" />
              </button>
              <button onClick={toggleTheme} className="hidden md:block text-muted hover:text-emerald-400 transition-all duration-300 hover:scale-125 hover:rotate-12">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {session ? (
                <div className="relative hidden md:block">
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 hover:bg-muted p-1.5 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black font-bold border-2 border-main text-sm no-invert">
                      {(profile?.full_name || session.user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-main rounded-2xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-main mb-2">
                        <p className="text-sm font-medium text-main truncate">{profile?.full_name || session.user.email}</p>
                      </div>
                      <Link 
                        to="/dashboard" 
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-muted hover:text-main hover:bg-main/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>
                      {['wajiuddin65@gmail.com', 'admin@eldetrades.com'].includes(session.user.email?.toLowerCase()) && (
                        <Link 
                          to="/admin" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <Link 
                        to="/settings" 
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-muted hover:text-main hover:bg-main/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <Link 
                        to="/history" 
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-muted hover:text-main hover:bg-main/10 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Transaction History</span>
                      </Link>
                      <div className="h-px bg-main my-2"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <button 
                    onClick={() => openAuth('login')} 
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 whitespace-nowrap"
                  >
                    Login
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center space-x-3 pl-1">
                <button className="text-muted hover:text-main transition-colors p-2 rounded-lg hover:bg-muted">
                  <Search className="w-5 h-5" />
                </button>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-main bg-muted hover:bg-main/10 transition-colors p-2 rounded-lg border border-main">
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-main">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  session ? navigate('/withdraw') : openAuth('login');
                }} 
                className="w-full text-left block px-3 py-3 text-base font-medium text-muted hover:text-main hover:bg-main/10 rounded-lg"
              >
                Withdraw
              </button>
              <Link to="/markets" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-muted hover:text-main hover:bg-main/10 rounded-lg">Markets</Link>
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-muted hover:text-main hover:bg-main/10 rounded-lg">Earn</Link>
              <Link to="/faqs" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-muted hover:text-main hover:bg-main/10 rounded-lg">FAQs</Link>
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">More</p>
                <Link to="/support" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted hover:text-main hover:bg-main/10 rounded-lg">Support</Link>
                <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted hover:text-main hover:bg-main/10 rounded-lg">Blog</Link>
              </div>
              <div className="pt-4 flex items-center justify-between px-3">
                <button onClick={toggleTheme} className="text-muted hover:text-main transition-colors flex items-center space-x-2">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="text-sm font-medium">Theme</span>
                </button>
              </div>
              {session ? (
                <div className="pt-4 flex flex-col space-y-3 px-3">
                  <div className="px-3 py-2 mb-2 flex items-center space-x-3 bg-muted rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black font-bold text-sm no-invert">
                      {(profile?.full_name || session.user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-main truncate">{profile?.full_name || session.user.email}</span>
                  </div>
                  <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} className="w-full text-left text-muted hover:text-main py-3 px-4 border border-main rounded-xl font-medium flex items-center space-x-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} className="w-full text-left text-muted hover:text-main py-3 px-4 border border-main rounded-xl font-medium flex items-center space-x-3">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full text-left bg-muted hover:bg-main/10 text-red-400 py-3 px-4 rounded-xl font-medium flex items-center space-x-3">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="pt-6 px-3">
                  <button 
                    onClick={() => openAuth('login')} 
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialMode={authMode} 
      />
    </>
  );
}

