import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BookOpen } from 'lucide-react';

export default function Blog() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20">
          <BookOpen className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Our Blog</h1>
        <p className="text-xl text-emerald-500 font-medium mb-8">Coming Soon</p>
        <p className="text-gray-400 text-center max-w-md">
          We are working hard to bring you the latest insights, market analysis, and trading strategies. Stay tuned!
        </p>
      </main>

      <Footer />
    </div>
  );
}
