import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number, showSign?: boolean, compact?: boolean) => string;
  rates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const defaultRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.25,
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [rates, setRates] = useState<Record<Currency, number>>(defaultRates);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('text')
          .eq('sender', 'system_settings_conversion')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const parsed = JSON.parse(data[0].text);
          if (parsed && typeof parsed === 'object') {
            const displayRates = parsed.withdrawalRates || parsed;
            setRates({ ...defaultRates, ...displayRates });
          }
        }
      } catch (err) {
        console.error('Error fetching conversion rates:', err);
      }
    };
    fetchRates();
  }, []);

  const formatCurrency = (value: number, showSign: boolean = false, compact: boolean = false) => {
    const converted = Math.abs(value) * rates[currency];
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 1 : 2,
      notation: compact ? 'compact' : 'standard',
    }).format(converted);

    if (showSign) {
      return value >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    
    return value < 0 ? `-${formatted}` : formatted;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
