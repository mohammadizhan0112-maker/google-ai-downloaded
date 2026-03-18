import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import LiveMarket from '../components/LiveMarket';
import StrategiesSection from '../components/StrategiesSection';
import Features from '../components/Features';
import Footer from '../components/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-main text-main font-sans selection:bg-emerald-500/30">
      <Header />
      <main>
        <Hero />
        <LiveMarket />
        <StrategiesSection />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
