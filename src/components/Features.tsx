import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Brain, Globe, Lock, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Neural Network Analysis',
    description: 'Our AI processes millions of data points per second to identify profitable trading patterns before they become obvious.',
    color: 'emerald'
  },
  {
    icon: Zap,
    title: 'High-Frequency Execution',
    description: 'Trades are executed in milliseconds via direct market access, ensuring you never miss a critical entry or exit point.',
    color: 'cyan'
  },
  {
    icon: Shield,
    title: 'Military-Grade Security',
    description: 'Your assets are protected by multi-party computation (MPC) wallets and hardware-level encryption.',
    color: 'blue'
  },
  {
    icon: Globe,
    title: 'Global Market Access',
    description: 'Trade across 50+ exchanges simultaneously. Crypto, gold, oil, and forex all from a single unified dashboard.',
    color: 'purple'
  },
  {
    icon: Lock,
    title: 'Smart Risk Management',
    description: 'Automated stop-losses, dynamic position sizing, and portfolio rebalancing protect your downside automatically.',
    color: 'rose'
  },
  {
    icon: BarChart3,
    title: 'Transparent Reporting',
    description: 'Real-time performance tracking with cryptographic proof of reserves and verifiable on-chain execution.',
    color: 'amber'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-main relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-emerald-500/5 rounded-[100%] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-bold text-main tracking-tight mb-6"
          >
            The Ultimate Trading Infrastructure
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted text-lg"
          >
            Built for institutional investors, now available to everyone. Experience the power of AI-driven asset management.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorMap: Record<string, string> = {
              emerald: 'text-emerald-400 group-hover:text-emerald-300',
              cyan: 'text-cyan-400 group-hover:text-cyan-300',
              blue: 'text-blue-400 group-hover:text-blue-300',
              purple: 'text-purple-400 group-hover:text-purple-300',
              rose: 'text-rose-400 group-hover:text-rose-300',
              amber: 'text-amber-400 group-hover:text-amber-300',
            };
            const glowMap: Record<string, string> = {
              emerald: 'hover:border-emerald-500/40 hover:shadow-glow-emerald',
              cyan: 'hover:border-cyan-500/40 hover:shadow-glow-cyan',
              blue: 'hover:border-blue-500/40 hover:shadow-glow-blue',
              purple: 'hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]',
              rose: 'hover:border-rose-500/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]',
              amber: 'hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
            };

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`bg-muted border border-main hover:bg-muted/80 hover:-translate-y-2 p-8 rounded-3xl transition-all duration-500 group ${glowMap[feature.color] || 'hover:border-emerald-500/40 hover:shadow-glow-emerald'}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-muted border border-main flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-muted/80 transition-all duration-500`}>
                  <Icon className={`w-7 h-7 transition-all duration-500 ${colorMap[feature.color] || 'text-emerald-400'}`} />
                </div>
                <h3 className="text-xl font-display font-bold text-main mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{feature.title}</h3>
                <p className="text-muted leading-relaxed text-sm font-medium">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
