import React, { useState, useMemo } from 'react';
import { ArrowUpIcon, ArrowDownIcon, EyeIcon } from './IconComponents';

interface Column<T> {
    header: string;
    accessor: keyof T;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    sortFn?: (a: T, b: T) => number;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    renderActions?: (item: T) => React.ReactNode;
    onViewDetails?: (item: T) => void;
    selection?: {
        selectedIds: string[];
        onToggleAll: () => void;
        onToggleRow: (id: string) => void;
        allSelected: boolean;
    };
    rowClassName?: (item: T) => string;
}

type SortConfig<T> = {
    key: keyof T;
    direction: 'ascending' | 'descending';
} | null;

const DataTable = <T extends { id: string },>(
    { columns, data, renderActions, onViewDetails, selection, rowClassName }: DataTableProps<T>
) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);
    const itemsPerPage = 10;

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            const sortColumn = columns.find(c => c.accessor === sortConfig.key);

            sortableItems.sort((a, b) => {
                // Use custom sort function if provided
                if (sortColumn?.sortFn) {
                    const result = sortColumn.sortFn(a, b);
                    return sortConfig.direction === 'ascending' ? result : -result;
                }
                
                // Default sorting logic
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];

                const isANull = valA === null || valA === undefined;
                const isBNull = valB === null || valB === undefined;

                if (isANull && isBNull) return 0;
                if (isANull) return 1; // nulls/undefined go to the end
                if (isBNull) return -1; // nulls/undefined go to the end
                
                let comparison = 0;
                // Enhanced type-aware sorting
                if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA - valB;
                } else if (typeof valA === 'string' && typeof valB === 'string') {
                    // Check if both strings match a date format (YYYY-MM-DD) to sort chronologically.
                    // This prevents misinterpreting numeric strings (like SKUs) as dates.
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(valA) && dateRegex.test(valB)) {
                        comparison = new Date(valA).getTime() - new Date(valB).getTime();
                    } else {
                        // For all other strings, use localeCompare for smart alphanumeric sorting.
                        // This correctly handles numbers within strings (e.g., 'SKU-10' vs 'SKU-9').
                        comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                    }
                } else {
                    // Fallback for other types or mixed types
                    if (valA < valB) {
                        comparison = -1;
                    } else if (valA > valB) {
                        comparison = 1;
                    }
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [data, sortConfig, columns]);
    
    const requestSort = (key: keyof T) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(data.length / itemsPerPage);

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {selection && (
                                <th className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                                        checked={selection.allSelected}
                                        onChange={selection.onToggleAll}
                                        aria-label="Select all items on this page"
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th 
                                    key={String(col.accessor)} 
                                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                    {col.sortable ? (
                                        <button onClick={() => requestSort(col.accessor)} className="flex items-center space-x-1 focus:outline-none">
                                            <span>{col.header}</span>
                                            {sortConfig?.key === col.accessor ? (
                                                sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>
                                            ) : <span className="w-3 h-3"></span>}
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            ))}
                            {(renderActions || onViewDetails) && <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => {
                                const isSelected = selection?.selectedIds.includes(item.id);
                                const customRowClass = rowClassName ? rowClassName(item) : '';
                                
                                return (
                                <tr 
                                    key={item.id} 
                                    className={`transition-colors duration-150 animate-slideInUp ${
                                        isSelected 
                                            ? 'bg-indigo-50 dark:bg-gray-700' 
                                            : customRowClass || 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
                                >
                                    {selection && (
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                                                checked={selection.selectedIds.includes(item.id)}
                                                onChange={() => selection.onToggleRow(item.id)}
                                                aria-label={`Select item ${item.id}`}
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td key={String(col.accessor)} className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-900 dark:text-gray-200">
                                              {col.render ? col.render(item) : (item[col.accessor] as React.ReactNode)}
                                            </span>
                                        </td>
                                    ))}
                                    {(renderActions || onViewDetails) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right no-print">
                                            <div className="flex items-center justify-end space-x-4">
                                                {onViewDetails && (
                                                    <button
                                                        onClick={() => onViewDetails(item)}
                                                        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                                        title="Edit details"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {renderActions && renderActions(item)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )})
                        ) : (
                            <tr>
                                <td colSpan={columns.length + (selection ? 1 : 0) + (renderActions || onViewDetails ? 1 : 0)} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, data.length)}</span> of{' '}
                            <span className="font-medium">{data.length}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataTable;