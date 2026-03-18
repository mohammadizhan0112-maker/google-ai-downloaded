import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Save, Edit2, X } from 'lucide-react';

export default function AdminContent() {
  const [activeSubTab, setActiveSubTab] = useState('crypto');
  const [cryptoMethods, setCryptoMethods] = useState<any[]>([
    { asset: 'USDT', network: 'TRC20', address: 'TR1ajLYHHKyA7LUgDVJ1i2BYzckUgACP87' },
    { asset: 'USDT', network: 'ERC20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'USDT', network: 'BEP20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'BTC', network: 'Bitcoin', address: 'bc1quez996jxpluemzuykx2m45wfs2q87kz0fu9dda' },
    { asset: 'BNB', network: 'BEP20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'BNB', network: 'ERC20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'SOL', network: 'Solana', address: '7FLnTudwmsfJ8J3W3TSdWhyG7AXxAKDM84N4bpFXT3bL' },
    { asset: 'USDC', network: 'Base', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'USDC', network: 'TRC20', address: 'TR1ajLYHHKyA7LUgDVJ1i2BYzckUgACP87' },
    { asset: 'USDC', network: 'BEP20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' },
    { asset: 'USDC', network: 'Solana', address: '7FLnTudwmsfJ8J3W3TSdWhyG7AXxAKDM84N4bpFXT3bL' },
    { asset: 'USDC', network: 'ERC20', address: '0xfa9d3cfca4c49eee44e990a64af4a3d962928bf9' }
  ]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [upiSettings, setUpiSettings] = useState<any>({ upiId: '', upiQr: '', minDeposit: 100, upiRate: 95.05 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .in('sender', ['system_settings_crypto', 'system_settings_strategies', 'system_settings_instruments', 'system_settings'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cryptoData = data.find(d => d.sender === 'system_settings_crypto');
      const stratData = data.find(d => d.sender === 'system_settings_strategies');
      const instData = data.find(d => d.sender === 'system_settings_instruments');
      const upiData = data.find(d => d.sender === 'system_settings');

      if (cryptoData) setCryptoMethods(JSON.parse(cryptoData.text));
      if (stratData) setStrategies(JSON.parse(stratData.text));
      if (instData) setInstruments(JSON.parse(instData.text));
      if (upiData) setUpiSettings(JSON.parse(upiData.text));
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (sender: string, data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing
      await supabase.from('support_messages').delete().eq('sender', sender);

      // Insert new
      const { error } = await supabase.from('support_messages').insert([{
        user_id: user.id,
        text: JSON.stringify(data),
        sender: sender,
        status: 'completed'
      }]);

      if (error) throw error;
      alert('Content saved successfully!');
      fetchContent();
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content');
    }
  };

  const renderCrypto = () => {
    const handleAdd = () => {
      setCryptoMethods([...cryptoMethods, { asset: 'USDT', network: 'TRC20', address: '', qrCode: '' }]);
    };

    const handleUpdate = (index: number, field: string, value: string) => {
      const newMethods = [...cryptoMethods];
      newMethods[index][field] = value;
      setCryptoMethods(newMethods);
    };

    const handleDelete = (index: number) => {
      const newMethods = cryptoMethods.filter((_, i) => i !== index);
      setCryptoMethods(newMethods);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Crypto Deposit Methods</h3>
          <button onClick={handleAdd} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Method</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {cryptoMethods.map((method, index) => (
            <div key={index} className="bg-main border border-main rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                <div>
                  <label className="block text-xs text-muted mb-1">Asset (e.g., USDT)</label>
                  <input value={method.asset} onChange={(e) => handleUpdate(index, 'asset', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Network (e.g., TRC20)</label>
                  <input value={method.network} onChange={(e) => handleUpdate(index, 'network', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Wallet Address</label>
                  <input value={method.address} onChange={(e) => handleUpdate(index, 'address', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">QR Code URL</label>
                  <input value={method.qrCode} onChange={(e) => handleUpdate(index, 'qrCode', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <button onClick={() => handleDelete(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-4 md:mt-0">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {cryptoMethods.length > 0 && (
          <button onClick={() => saveContent('system_settings_crypto', cryptoMethods)} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Crypto Methods</span>
          </button>
        )}

        <div className="mt-12">
          <h3 className="text-xl font-bold text-main mb-6">UPI Deposit Settings (India)</h3>
          <div className="bg-main border border-main rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">UPI ID</label>
              <input 
                value={upiSettings.upiId || ''} 
                onChange={(e) => setUpiSettings({ ...upiSettings, upiId: e.target.value })} 
                className="w-full bg-transparent border border-main rounded-lg px-4 py-3 text-main focus:border-emerald-500 focus:outline-none" 
                placeholder="e.g., yourname@upi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-2">UPI QR Code URL</label>
              <input 
                value={upiSettings.upiQr || ''} 
                onChange={(e) => setUpiSettings({ ...upiSettings, upiQr: e.target.value })} 
                className="w-full bg-transparent border border-main rounded-lg px-4 py-3 text-main focus:border-emerald-500 focus:outline-none" 
                placeholder="https://example.com/qr.png"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Min Deposit (USDT)</label>
                <input 
                  type="number"
                  value={upiSettings.minDeposit || 100} 
                  onChange={(e) => setUpiSettings({ ...upiSettings, minDeposit: Number(e.target.value) })} 
                  className="w-full bg-transparent border border-main rounded-lg px-4 py-3 text-main focus:border-emerald-500 focus:outline-none" 
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Conversion Rate (INR per 1 USDT)</label>
                <input 
                  type="number"
                  value={upiSettings.upiRate || 85} 
                  onChange={(e) => setUpiSettings({ ...upiSettings, upiRate: Number(e.target.value) })} 
                  className="w-full bg-transparent border border-main rounded-lg px-4 py-3 text-main focus:border-emerald-500 focus:outline-none" 
                  placeholder="85"
                />
              </div>
            </div>
            <button 
              onClick={() => saveContent('system_settings', upiSettings)} 
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold transition-colors mt-4"
            >
              <Save className="w-4 h-4" />
              <span>Save UPI Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStrategies = () => {
    const handleAdd = () => {
      setStrategies([...strategies, { 
        id: `strategy-${Date.now()}`, 
        name: 'New Strategy', 
        description: '', 
        apy: '10.0% - 15.0%', 
        risk: 'Medium', 
        tvl: 1000000, 
        icon: 'TrendingUp', 
        color: 'blue',
        details: { pairs: [], riskAppetite: '', mechanics: '', maxDrawdown: '', recommendedDuration: '' }
      }]);
    };

    const handleUpdate = (index: number, field: string, value: any) => {
      const newStrats = [...strategies];
      newStrats[index][field] = value;
      setStrategies(newStrats);
    };

    const handleDetailsUpdate = (index: number, field: string, value: any) => {
      const newStrats = [...strategies];
      newStrats[index].details[field] = value;
      setStrategies(newStrats);
    };

    const handleDelete = (index: number) => {
      const newStrats = strategies.filter((_, i) => i !== index);
      setStrategies(newStrats);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Investment Strategies</h3>
          <button onClick={handleAdd} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Strategy</span>
          </button>
        </div>

        <div className="space-y-6">
          {strategies.map((strategy, index) => (
            <div key={index} className="bg-main border border-main rounded-xl p-6 relative">
              <button onClick={() => handleDelete(index)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-muted mb-1">ID (used for logic)</label>
                  <input value={strategy.id} onChange={(e) => handleUpdate(index, 'id', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Name</label>
                  <input value={strategy.name} onChange={(e) => handleUpdate(index, 'name', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted mb-1">Description</label>
                  <textarea value={strategy.description} onChange={(e) => handleUpdate(index, 'description', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none h-20" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">APY Display (e.g., 10% - 15%)</label>
                  <input value={strategy.apy} onChange={(e) => handleUpdate(index, 'apy', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Risk Level</label>
                  <input value={strategy.risk} onChange={(e) => handleUpdate(index, 'risk', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">TVL (Number)</label>
                  <input type="number" value={strategy.tvl} onChange={(e) => handleUpdate(index, 'tvl', Number(e.target.value))} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Color Theme (emerald, blue, orange)</label>
                  <input value={strategy.color} onChange={(e) => handleUpdate(index, 'color', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>

              <h4 className="text-sm font-bold text-main mb-3 border-t border-main pt-4">Strategy Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted mb-1">Traded Pairs (comma separated)</label>
                  <input value={strategy.details?.pairs?.join(', ') || ''} onChange={(e) => handleDetailsUpdate(index, 'pairs', e.target.value.split(',').map(s => s.trim()))} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted mb-1">Risk Appetite</label>
                  <textarea value={strategy.details?.riskAppetite || ''} onChange={(e) => handleDetailsUpdate(index, 'riskAppetite', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none h-16" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted mb-1">Mechanics</label>
                  <textarea value={strategy.details?.mechanics || ''} onChange={(e) => handleDetailsUpdate(index, 'mechanics', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none h-16" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Max Drawdown</label>
                  <input value={strategy.details?.maxDrawdown || ''} onChange={(e) => handleDetailsUpdate(index, 'maxDrawdown', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Recommended Duration</label>
                  <input value={strategy.details?.recommendedDuration || ''} onChange={(e) => handleDetailsUpdate(index, 'recommendedDuration', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {strategies.length > 0 && (
          <button onClick={() => saveContent('system_settings_strategies', strategies)} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Strategies</span>
          </button>
        )}
      </div>
    );
  };

  const renderInstruments = () => {
    const handleAdd = () => {
      setInstruments([...instruments, { symbol: 'NEW', name: 'New Instrument', spread: '0.0', type: 'Crypto', logo: '' }]);
    };

    const handleUpdate = (index: number, field: string, value: string) => {
      const newInsts = [...instruments];
      newInsts[index][field] = value;
      setInstruments(newInsts);
    };

    const handleDelete = (index: number) => {
      const newInsts = instruments.filter((_, i) => i !== index);
      setInstruments(newInsts);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Supported Instruments</h3>
          <button onClick={handleAdd} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Instrument</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {instruments.map((inst, index) => (
            <div key={index} className="bg-main border border-main rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                <div>
                  <label className="block text-xs text-muted mb-1">Symbol</label>
                  <input value={inst.symbol} onChange={(e) => handleUpdate(index, 'symbol', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Name</label>
                  <input value={inst.name} onChange={(e) => handleUpdate(index, 'name', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Spread</label>
                  <input value={inst.spread} onChange={(e) => handleUpdate(index, 'spread', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Type</label>
                  <input value={inst.type} onChange={(e) => handleUpdate(index, 'type', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Logo URL</label>
                  <input value={inst.logo} onChange={(e) => handleUpdate(index, 'logo', e.target.value)} className="w-full bg-transparent border border-main rounded-lg px-3 py-2 text-main focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <button onClick={() => handleDelete(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-4 md:mt-0">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {instruments.length > 0 && (
          <button onClick={() => saveContent('system_settings_instruments', instruments)} className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Instruments</span>
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-main/10 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-main/10 rounded"></div><div className="h-4 bg-main/10 rounded w-5/6"></div></div></div></div>;
  }

  return (
    <div className="bg-card border border-main rounded-2xl p-6">
      <h2 className="text-2xl font-display font-bold text-main mb-6">Platform Content Management</h2>
      
      <div className="flex space-x-4 mb-8 border-b border-main pb-4">
        <button 
          onClick={() => setActiveSubTab('crypto')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'crypto' ? 'bg-main/10 text-main' : 'text-muted hover:text-main'}`}
        >
          Crypto Deposits
        </button>
        <button 
          onClick={() => setActiveSubTab('strategies')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'strategies' ? 'bg-main/10 text-main' : 'text-muted hover:text-main'}`}
        >
          Strategies
        </button>
        <button 
          onClick={() => setActiveSubTab('instruments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'instruments' ? 'bg-main/10 text-main' : 'text-muted hover:text-main'}`}
        >
          Instruments
        </button>
      </div>

      {activeSubTab === 'crypto' && renderCrypto()}
      {activeSubTab === 'strategies' && renderStrategies()}
      {activeSubTab === 'instruments' && renderInstruments()}
    </div>
  );
}
