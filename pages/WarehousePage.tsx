import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { mockWarehouses } from '../data/mockData';
import { Warehouse } from '../types';
import { useAuth } from '../context/AuthContext';
import { PlusIcon } from '../components/IconComponents';

const AddWarehouseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would get form data from state and submit it
        console.log("Adding new warehouse...");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Warehouse">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Warehouse Name</label>
                        <input type="text" name="name" required className="mt-1 block w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location (City, State)</label>
                        <input type="text" name="location" required className="mt-1 block w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity (Tons)</label>
                        <input type="number" name="capacity" required className="mt-1 block w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manager</label>
                        <input type="text" name="manager" required className="mt-1 block w-full" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Phone</label>
                        <input type="tel" name="contact" required className="mt-1 block w-full" />
                    </div>
                </div>
                 <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Warehouse</button>
                </div>
            </form>
        </Modal>
    );
};


const WarehousePage: React.FC = () => {
    const { currentUser } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);

    const columns = [
        { header: 'Warehouse ID', accessor: 'id' as keyof Warehouse },
        { header: 'Name', accessor: 'name' as keyof Warehouse, sortable: true },
        { header: 'Location', accessor: 'location' as keyof Warehouse, sortable: true },
        { header: 'Stock (Tons)', accessor: 'stockCount' as keyof Warehouse, sortable: true, render: (item: Warehouse) => item.stockCount.toLocaleString() },
        { header: 'Capacity (Tons)', accessor: 'capacity' as keyof Warehouse, sortable: true, render: (item: Warehouse) => item.capacity.toLocaleString() },
        { header: 'Utilization', accessor: 'id' as keyof Warehouse, sortable: true, render: (item: Warehouse) => {
            const utilization = (item.stockCount / item.capacity) * 100;
            return (
                <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${utilization}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold">{utilization.toFixed(1)}%</span>
                </div>
            );
        }},
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Warehouses</h2>
                {currentUser?.roles.includes('Admin') && (
                    <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add New Warehouse
                    </button>
                )}
            </div>
            <DataTable columns={columns} data={mockWarehouses} />
            <AddWarehouseModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
};

export default WarehousePage;