
import React, { useState, useEffect } from 'react';

const OfflineIndicator: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline) {
        return null;
    }

    return (
        <div 
            className="bg-yellow-500 text-white text-center p-2 text-sm font-semibold animate-fadeIn"
            role="status"
            aria-live="polite"
        >
            You are currently offline. Changes will be saved and synced when you're back online.
        </div>
    );
};

export default OfflineIndicator;