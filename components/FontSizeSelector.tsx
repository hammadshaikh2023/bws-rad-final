import React, { useState, useRef, useEffect } from 'react';
import { useFontSize, FontSize } from '../context/FontSizeContext';
import { FontSizeIcon } from './IconComponents';

const sizeOptions: { value: FontSize; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'base', label: 'Normal' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'Extra Large' },
];

const FontSizeSelector: React.FC = () => {
    const { fontSize, setFontSize } = useFontSize();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleSelect = (size: FontSize) => {
        setFontSize(size);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                aria-label="Adjust font size"
            >
                <FontSizeIcon className="w-5 h-5" />
            </button>
            
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-20 border dark:border-gray-700">
                     <div className="p-2 font-semibold text-sm border-b dark:border-gray-700 text-gray-800 dark:text-white">Text Size</div>
                     <ul className="py-1">
                        {sizeOptions.map(option => (
                             <li key={option.value}>
                                <button
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                        fontSize === option.value
                                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            </li>
                        ))}
                     </ul>
                 </div>
            )}
        </div>
    );
};

export default FontSizeSelector;
