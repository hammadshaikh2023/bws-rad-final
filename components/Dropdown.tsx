import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, SearchIcon } from './IconComponents';

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    wrapperClassName?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, placeholder = "Select...", wrapperClassName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(option => option.value === value);

    const filteredOptions = searchTerm
        ? options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${wrapperClassName || 'w-full'}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-full cursor-default rounded-md bg-gray-50 dark:bg-gray-700 py-3 pl-4 pr-10 text-left text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="block truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {isOpen && (
                <div
                    className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon className="h-4 w-4 text-gray-400" />
                            </span>
                             <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-md border-0 bg-gray-50 dark:bg-gray-700 py-1.5 pl-9 pr-3 text-gray-900 dark:text-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                                autoFocus
                            />
                        </div>
                    </div>
                    <ul
                        className="overflow-auto py-1 max-h-48"
                        role="listbox"
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                className={`relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span className={`block truncate ${selectedOption?.value === option.value ? 'font-semibold' : 'font-normal'}`}>
                                    {option.label}
                                </span>
                            </li>
                        ))) : (
                            <li className="relative cursor-default select-none py-2 px-4 text-gray-500">
                                No options found.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Dropdown;