import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';

const defaultInstruments = [
  { symbol: 'XAUUSD', name: 'Gold vs US Dollar', spread: '1.2', type: 'Commodity', logo: 'https://cryptologos.cc/logos/pax-gold-paxg-logo.svg?v=029' },
  { symbol: 'US OIL', name: 'WTI Crude Oil', spread: '2.5', type: 'Commodity', logo: 'https://cdn-icons-png.flaticon.com/512/3262/3262973.png' },
  { symbol: 'SILVER', name: 'Silver vs US Dollar', spread: '1.5', type: 'Commodity', logo: 'https://cdn-icons-png.flaticon.com/512/771/771183.png' },
  { symbol: 'BTCUSDT', name: 'Bitcoin', spread: '15.0', type: 'Crypto', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029' },
  { symbol: 'ETHUSDT', name: 'Ethereum', spread: '2.5', type: 'Crypto', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029' },
  { symbol: 'SOLUSDT', name: 'Solana', spread: '0.5', type: 'Crypto', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=029' },
  { symbol: 'EURUSD', name: 'Euro vs US Dollar', spread: '0.6', type: 'Forex', logo: 'https://cdn-icons-png.flaticon.com/512/197/197615.png' },
  { symbol: 'GBPUSD', name: 'British Pound vs US Dollar', spread: '0.8', type: 'Forex', logo: 'https://cdn-icons-png.flaticon.com/512/197/197374.png' },
  { symbol: 'GBPJPY', name: 'British Pound vs Japanese Yen', spread: '1.4', type: 'Forex', logo: 'https://cdn-icons-png.flaticon.com/512/197/197604.png' },
];

export default function InstrumentsTable() {
  const [instruments, setInstruments] = useState(defaultInstruments);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_instruments')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const parsed = JSON.parse(data[0].text);
          if (parsed && parsed.length > 0) {
            setInstruments(parsed);
          }
        }
      } catch (err) {
        console.error('Error fetching instruments:', err);
      }
    };
    fetchInstruments();
  }, []);

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-gray-400 text-sm uppercase tracking-wider">
              <th className="p-6 font-medium">Instrument</th>
              <th className="p-6 font-medium">Type</th>
              <th className="p-6 font-medium text-right">Avg. Spread</th>
              <th className="p-6 font-medium text-right">AI Trading Status</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((inst, index) => (
              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden p-2 border border-white/10">
                      <img src={inst.logo} alt={inst.symbol} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{inst.symbol}</p>
                      <p className="text-sm text-gray-500">{inst.name}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                    {inst.type}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <p className="font-mono font-medium text-white">{inst.spread} pips</p>
                </td>
                <td className="p-6 text-right">
                  <span className="inline-flex items-center text-emerald-500 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full">
                    <Activity className="w-4 h-4 mr-1.5" /> Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
