import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveMarket from '../components/LiveMarket';
import InstrumentsTable from '../components/InstrumentsTable';
import { Layers } from 'lucide-react';

export default function Markets() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Global Markets, <span className="text-emerald-500">Live Prices</span>
            </h1>
            <p className="text-xl text-gray-400">
              Our AI trading algorithms actively monitor and trade across a diverse range of global markets with competitive spreads.
            </p>
          </div>

          <LiveMarket />

          <div className="mt-20">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Layers className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-display font-bold">Supported Instruments & Spreads</h2>
            </div>

            <InstrumentsTable />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
