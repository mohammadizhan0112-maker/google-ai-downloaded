import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function FAQs() {
  const faqs = [
    {
      question: "How does the AI trading algorithm work?",
      answer: "Our AI trading algorithm uses advanced machine learning models to analyze market data, identify patterns, and execute trades across various instruments including crypto, forex, and commodities. It continuously learns and adapts to changing market conditions to optimize returns and manage risk."
    },
    {
      question: "What is the minimum deposit required?",
      answer: "The minimum deposit required to start using our AI trading strategies is $100. This allows you to allocate funds across different strategies and start earning yields."
    },
    {
      question: "How can I withdraw my funds?",
      answer: "You can withdraw your funds at any time through the 'Withdraw' section in your dashboard. We support withdrawals to crypto wallets (USDT, BTC, ETH, SOL) and bank accounts via various methods depending on your currency."
    },
    {
      question: "Is my money safe?",
      answer: "Security is our top priority. We employ bank-grade encryption, two-factor authentication (2FA), and cold storage for the majority of digital assets. Our smart contracts and trading algorithms are regularly audited by independent security firms."
    },
    {
      question: "What are the fees?",
      answer: "We charge a performance fee only on profitable trades. There are no hidden deposit or withdrawal fees, though standard network fees for crypto transactions may apply."
    },
    {
      question: "How do I verify my identity?",
      answer: "To verify your identity, go to Settings > Profile Information and click the 'VERIFY' button. You will need to upload a valid government-issued ID (Passport, National ID, or Driver's License)."
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <HelpCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Frequently Asked <span className="text-emerald-500">Questions</span>
            </h1>
            <p className="text-xl text-gray-400">
              Find answers to common questions about our platform, trading strategies, and security.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-white pr-4">{faq.question}</h3>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-open:bg-emerald-500/10 group-open:text-emerald-500 transition-colors">
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:text-emerald-500 group-open:rotate-180 transition-all" />
                  </div>
                </summary>
                <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
