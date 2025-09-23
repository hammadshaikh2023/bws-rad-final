
import React from 'react';
import { QrCodeIcon } from './IconComponents';

const BarcodeScanner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg dark:border-gray-600">
            <div className="w-full max-w-sm h-64 bg-gray-900 rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
                {/* Simulated camera view with scanning line */}
                <div className="absolute top-0 w-full h-1 bg-green-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.7)] animate-scan-line"></div>
                <QrCodeIcon className="w-24 h-24 text-gray-600" />
                 <style>{`
                    @keyframes scan-line {
                        0% { transform: translateY(-10px); }
                        100% { transform: translateY(256px); }
                    }
                    .animate-scan-line {
                        animation: scan-line 2s infinite linear;
                    }
                `}</style>
            </div>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
                Point your camera at a barcode.
            </p>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
                Scan Item
            </button>
        </div>
    );
};

export default BarcodeScanner;
