import React from 'react';
import { motion } from 'motion/react';
import { BarChart2, Layers, Bitcoin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const strategies = [
  {
    id: 'stable',
    icon: BarChart2,
    apr: '+1.3% APR',
    title: 'STEADY YIELD ENGINE',
    subtitle: 'AI-driven low-volatility trading designed to protect capital while generating steady returns.',
    delay: 0.1,
    bgImage: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'goldy',
    icon: Layers,
    apr: '+7.2% APR',
    title: 'COMMODITY ALPHA ENGINE',
    subtitle: 'High-performance AI targetting Gold and US Oil macro oopurtunities making high returns.',
    delay: 0.2,
    bgImage: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'btc',
    icon: Bitcoin,
    apr: '+4.6% APR',
    title: 'CRYPTO MOMENTUM ENGINE',
    subtitle: 'BTC & ETH-focused strategies deployed securely via tokenized wrappers.',
    delay: 0.3,
    bgImage: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=800&auto=format&fit=crop'
  }
];

export default function StrategiesSection() {
  return (
    <section className="py-24 bg-main relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-bold text-main tracking-tight mb-4"
          >
            Automated Vaults
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted max-w-2xl text-lg"
          >
            Deploy capital into our battle-tested algorithmic strategies designed for different risk profiles.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {strategies.map((strategy) => {
            const Icon = strategy.icon;
            return (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: strategy.delay, duration: 0.5 }}
                className="group relative bg-card border border-main hover:border-emerald-500/30 rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] flex flex-col h-full overflow-hidden"
              >
                {/* Luxury Background Image */}
                <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                  <img 
                    src={strategy.bgImage} 
                    alt="" 
                    className="w-full h-full object-cover opacity-10 group-hover:opacity-30 transition-opacity duration-500 mix-blend-luminosity scale-105 group-hover:scale-100" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-transparent" />
                </div>

                <div className="relative z-10 flex justify-between items-start mb-12">
                  <div className="w-12 h-12 rounded-full bg-muted/50 backdrop-blur-md border border-main flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="w-5 h-5 text-muted group-hover:text-main transition-colors" />
                  </div>
                  <div className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {strategy.apr}
                  </div>
                </div>

                <div className="relative z-10 flex-1">
                  <h3 className="text-xl font-display font-bold text-main mb-3 tracking-wide">
                    {strategy.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {strategy.subtitle}
                  </p>
                </div>

                <div className="relative z-10 mt-12 pt-6 border-t border-main">
                  <Link to="/dashboard" className="inline-flex items-center space-x-2 text-xs font-bold tracking-widest text-muted hover:text-main uppercase transition-colors group/link">
                    <span>Details</span>
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
