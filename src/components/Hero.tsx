import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { BTCLogo, ETHLogo, SOLLogo } from './CryptoLogos';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden flex items-center">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-emerald-500/20 rounded-full blur-[160px] opacity-60 pointer-events-none animate-pulse" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
          
          {/* Left Content */}
          <div className="max-w-2xl md:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-muted border border-main rounded-full px-4 py-2 mb-8 hover:bg-muted/80 hover:border-emerald-500/30 transition-all duration-300 cursor-default"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-medium text-muted">AI Trading Engine v2.0 Live</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-main tracking-tight leading-[1.1] mb-6"
            >
              Next-Gen AI Powered Trading.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Safe, Smart, Profitable.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted mb-10 leading-relaxed max-w-xl"
            >
              Advanced algorithms working 24/7 to deliver consistent returns with intelligent risk management.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <button 
                onClick={() => {
                  if (session) {
                    navigate('/dashboard');
                  } else {
                    window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'login' } }));
                  }
                }}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] active:scale-95 flex items-center justify-center space-x-2 group relative overflow-hidden"
              >
                <span className="relative z-10">{session ? 'Go to Dashboard' : 'Login'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
              
              <div className="flex items-center space-x-4 text-sm text-muted">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img key={i} src={`https://images.unsplash.com/photo-${[
                      '1535713875002-d1d0cf377fde',
                      '1527980965255-d3b416303d12',
                      '1438761681033-6461ffad8d80',
                      '1500648767791-00dcc994a43e'
                    ][i-1]}?w=100&h=100&fit=crop`} alt="User" className="w-10 h-10 rounded-full border-2 border-main object-cover shadow-lg" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <div>
                  <div className="text-main font-bold text-glow-emerald">100K+</div>
                  <div className="text-xs uppercase tracking-widest font-medium opacity-70">Active Traders</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Image & Floating Cards */}
          <div className="relative md:h-[600px] lg:h-[700px] flex items-center justify-center md:justify-end mt-12 md:mt-0">
            <div className="relative w-full max-w-[320px] sm:max-w-[380px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative z-10 w-full"
              >
                {/* Phone Mockup */}
                <div className="relative rounded-[3rem] border-[8px] border-main bg-card shadow-[0_0_100px_rgba(16,185,129,0.15)] overflow-hidden aspect-[1/2]">
                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-main rounded-b-3xl w-40 mx-auto z-20"></div>
                  
                  {/* App UI */}
                  <div className="absolute inset-0 bg-gradient-to-b from-card via-main to-card p-6 pt-12 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <div className="text-muted text-xs uppercase tracking-widest font-bold">Total Balance</div>
                        <div className="text-3xl font-display font-bold text-main mt-1 tracking-tight">$124,592.50</div>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-glow-emerald">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-40 w-full mb-8 relative">
                      <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <path d="M0,50 L0,30 C20,30 30,10 50,20 C70,30 80,10 100,5 L100,50 Z" fill="url(#gradient)" opacity="0.2" />
                        <path d="M0,30 C20,30 30,10 50,20 C70,30 80,10 100,5" fill="none" stroke="#34d399" strokeWidth="2" />
                        <defs>
                          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Assets List */}
                    <div className="space-y-3 flex-1">
                      <div className="text-main font-bold text-xs uppercase tracking-[0.2em] mb-4 opacity-50">AI Portfolio</div>
                      {[
                        { name: 'Bitcoin', symbol: 'BTC', amount: '1.24', value: '$82,450', change: '+5.2%', Logo: BTCLogo },
                        { name: 'Ethereum', symbol: 'ETH', amount: '14.5', value: '$34,120', change: '+2.8%', Logo: ETHLogo },
                        { name: 'Solana', symbol: 'SOL', amount: '145.2', value: '$8,022', change: '+12.4%', Logo: SOLLogo },
                      ].map((asset, i) => (
                        <div key={i} className="flex justify-between items-center bg-muted p-3 rounded-2xl border border-main hover:bg-muted/80 hover:scale-[1.02] hover:border-emerald-500/40 hover:shadow-glow-emerald transition-all duration-300 cursor-pointer group">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors duration-300">
                              <asset.Logo className="w-7 h-7" />
                            </div>
                            <div>
                              <div className="text-main font-bold text-sm tracking-tight">{asset.name}</div>
                              <div className="text-muted text-[10px] font-bold uppercase tracking-wider">{asset.amount} {asset.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-main font-bold text-sm">{asset.value}</div>
                            <div className="text-emerald-400 text-[10px] font-bold">{asset.change}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute top-20 -left-12 sm:-left-20 bg-card/80 backdrop-blur-xl border border-main p-4 rounded-2xl shadow-2xl z-20 hidden sm:block"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-main font-bold">Smart Risk</div>
                    <div className="text-muted text-sm">Protection Active</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-32 -right-12 sm:-right-20 bg-card/80 backdrop-blur-xl border border-main p-4 rounded-2xl shadow-2xl z-20 hidden sm:block"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-main font-bold">Auto-Trade</div>
                    <div className="text-emerald-400 text-sm font-medium">+2.4% Today</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
