
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronDownIcon, PrinterIcon, PdfIcon, ExcelIcon, WordIcon } from './IconComponents';

interface ExportColumn<T> {
    header: string;
    accessor: keyof T;
}

interface ExportDropdownProps<T> {
    data: T[];
    columns: ExportColumn<T>[];
    fileName: string;
}

// FIX: Corrected generic type syntax to be unambiguous for the TSX parser by using `<T extends {}>`. This resolves numerous parsing errors.
const ExportDropdown = <T extends {}>({ data, columns, fileName }: ExportDropdownProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);

    const handlePrint = () => {
        window.print();
        setIsOpen(false);
    };

    const handleExportCsv = () => {
        const headers = columns.map(c => c.header).join(',');
        const rows = data.map(row => 
            columns.map(col => `"${String(row[col.accessor]).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsOpen(false);
    };
    
    const handleExportPdf = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [columns.map(c => c.header)],
            body: data.map(row => columns.map(col => {
                const value = row[col.accessor];
                return value === null || value === undefined ? '' : String(value);
            })),
        });
        doc.save(`${fileName}.pdf`);
        setIsOpen(false);
    };

    const handleExportWord = () => {
        const headerHtml = `<tr>${columns.map(c => `<th>${c.header}</th>`).join('')}</tr>`;
        const bodyHtml = data.map(row => 
            `<tr>${columns.map(col => `<td>${String(row[col.accessor])}</td>`).join('')}</tr>`
        ).join('');

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charSet='utf-8'><title>Export HTML to Word</title></head>
                <body>
                    <table>
                        <thead>${headerHtml}</thead>
                        <tbody>${bodyHtml}</tbody>
                    </table>
                </body>
            </html>`;
        
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsOpen(false);
    };


    return (
        <div className="relative inline-block text-left no-print">
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                    id="menu-button"
                    aria-expanded="true"
                    aria-haspopup="true"
                >
                    Export
                    <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        <MenuItem onClick={handlePrint} icon={<PrinterIcon className="w-5 h-5 mr-3"/>} label="Print" />
                        <MenuItem onClick={handleExportPdf} icon={<PdfIcon className="w-5 h-5 mr-3"/>} label="Export as PDF" />
                        <MenuItem onClick={handleExportCsv} icon={<ExcelIcon className="w-5 h-5 mr-3"/>} label="Export as Excel (CSV)" />
                        <MenuItem onClick={handleExportWord} icon={<WordIcon className="w-5 h-5 mr-3"/>} label="Export as Word" />
                    </div>
                </div>
            )}
        </div>
    );
};

const MenuItem: React.FC<{onClick: () => void, icon: React.ReactNode, label: string}> = ({onClick, icon, label}) => (
    <button
        onClick={onClick}
        className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center w-full px-4 py-2 text-sm text-left"
        role="menuitem"
    >
        {icon}
        {label}
    </button>
);

export default ExportDropdown;