import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

interface FontSizeContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        const storedSize = localStorage.getItem('fontSize');
        return (storedSize as FontSize) || 'base';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove any existing font size classes
        root.classList.remove('font-sm', 'font-base', 'font-lg', 'font-xl');
        // Add the new class
        root.classList.add(`font-${fontSize}`);
        // Persist to local storage
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
};

export const useFontSize = (): FontSizeContextType => {
    const context = useContext(FontSizeContext);
    if (context === undefined) {
        throw new Error('useFontSize must be used within a FontSizeProvider');
    }
    return context;
};
