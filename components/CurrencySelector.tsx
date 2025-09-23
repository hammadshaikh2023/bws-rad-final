import React, { useState, useEffect, useRef } from 'react';
import { currencies } from '../data/currencies';
import { Currency } from '../types';
import { ChevronDownIcon } from './IconComponents';

interface CurrencySelectorProps {
    value: Currency;
    onChange: (value: Currency) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredCurrencies = currencies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const selectedCurrency = currencies.find(c => c.code === value) || currencies[0];

    const handleSelect = (code: Currency) => {
        onChange(code);
        setIsOpen(false);
        setSearchTerm('');
    };

     useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);


    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="mt-1 block w-full rounded-md text-left flex justify-between items-center px-4 py-3 bg-gray-50 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <span>{selectedCurrency.code} - {selectedCurrency.name}</span>
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md max-h-60 overflow-hidden border dark:border-gray-600">
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Search currency..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <ul className="overflow-y-auto max-h-48">
                        {filteredCurrencies.map(currency => (
                            <li
                                key={currency.code}
                                onClick={() => handleSelect(currency.code)}
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 cursor-pointer"
                            >
                                {currency.code} - {currency.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CurrencySelector;