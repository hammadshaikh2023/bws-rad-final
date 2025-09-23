import React, { useState, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { mockAuditLogs } from '../data/mockData';
import { AuditLog } from '../types';
import ExportDropdown from '../components/ExportDropdown';

const AuditPage: React.FC = () => {
    const [typeFilter, setTypeFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filteredLogs = useMemo(() => {
        return mockAuditLogs
            .filter(log => typeFilter === 'All' || log.type === typeFilter)
            .filter(log => {
                if (!dateFrom || !dateTo) return true;
                const logDate = new Date(log.timestamp.split(' ')[0]);
                return logDate >= new Date(dateFrom) && logDate <= new Date(dateTo);
            });
    }, [typeFilter, dateFrom, dateTo]);

    const columns = [
        { header: 'Timestamp', accessor: 'timestamp' as keyof AuditLog, sortable: true },
        { header: 'User', accessor: 'user' as keyof AuditLog, sortable: true },
        { header: 'Type', accessor: 'type' as keyof AuditLog, sortable: true, render: (log: AuditLog) => {
             const colors: { [key: string]: string } = {
                'Sales': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                'Purchase': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
                'Inventory': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                'User Management': 'bg-gray-100 text-gray-800 dark:bg-gray-600/50 dark:text-gray-300'
            };
            return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[log.type]}`}>{log.type}</span>;
        }},
        { header: 'Action', accessor: 'action' as keyof AuditLog, sortable: true },
        { header: 'Details', accessor: 'details' as keyof AuditLog },
    ];

    const exportColumns = columns.map(c => ({ header: c.header, accessor: c.accessor }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Audit Log</h2>
                <ExportDropdown
                    data={filteredLogs}
                    columns={exportColumns}
                    fileName="Audit_Log"
                />
            </div>
            
             <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col md:flex-row items-center gap-4 no-print">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">From:</label>
                    <input 
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className=""
                    />
                </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">To:</label>
                    <input 
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className=""
                    />
                </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Type:</label>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="">
                        <option value="All">All Types</option>
                        <option value="Sales">Sales</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Inventory">Inventory</option>
                        <option value="User Management">User Management</option>
                    </select>
                </div>
            </div>

            <DataTable columns={columns} data={filteredLogs} />
        </div>
    );
};

export default AuditPage;