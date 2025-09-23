import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Currency } from '../types';

interface SettingsContextType {
    defaultCurrency: Currency;
    setDefaultCurrency: (currency: Currency) => void;
    lowStockThreshold: number;
    setLowStockThreshold: (threshold: number) => void;
}

// FIX: Exported SettingsContext to allow its use in other modules, such as test files.
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [defaultCurrency, setDefaultCurrencyState] = useState<Currency>(() => {
        return localStorage.getItem('defaultCurrency') || 'AED';
    });

    const [lowStockThreshold, setLowStockThresholdState] = useState<number>(() => {
        return Number(localStorage.getItem('lowStockThreshold')) || 1000;
    });

    useEffect(() => {
        localStorage.setItem('defaultCurrency', defaultCurrency);
    }, [defaultCurrency]);

    useEffect(() => {
        localStorage.setItem('lowStockThreshold', String(lowStockThreshold));
    }, [lowStockThreshold]);

    const setDefaultCurrency = (currency: Currency) => {
        setDefaultCurrencyState(currency);
    };
    
    const setLowStockThreshold = (threshold: number) => {
        setLowStockThresholdState(threshold);
    };

    return (
        <SettingsContext.Provider value={{ defaultCurrency, setDefaultCurrency, lowStockThreshold, setLowStockThreshold }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};