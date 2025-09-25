import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Supplier } from '../types';
import { PlusIcon } from '../components/IconComponents';

const AddEditVendorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    vendor: Supplier | null;
}> = ({ isOpen, onClose, vendor }) => {
    const { addSupplier, updateSupplier } = useData();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Partial<Supplier>>({});

    React.useEffect(() => {
        if (vendor) {
            setFormData(vendor);
        } else {
            setFormData({
                name: '',
                contactPerson: 'N/A',
                email: 'N/A',
                phone: 'N/A',
                address: '',
            });
        }
    }, [vendor, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert("Vendor name is required.");
            return;
        }

        const userName = currentUser?.name || 'System';

        if (vendor) {
            updateSupplier(formData as Supplier, userName);
        } else {
            addSupplier(formData as Omit<Supplier, 'id'>, userName);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={vendor ? "Edit Vendor" : "Add New Vendor"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor Name</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
                        <input type="text" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                    <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={3}></textarea>
                </div>

                {vendor?.history && vendor.history.length > 0 && (
                    <div className="pt-4 mt-4 border-t dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Change History</h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
                            Last updated on {new Date(vendor.history[0].timestamp).toLocaleString()} by {vendor.history[0].user}
                        </div>
                        <div className="mt-2 space-y-2 max-h-24 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md border dark:border-gray-700">
                            {vendor.history.map((entry, index) => (
                                <div key={index} className="text-xs">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 break-words">{entry.action}</p>
                                    <p className="text-gray-500 dark:text-gray-400">{entry.user} - {new Date(entry.timestamp).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{vendor ? "Save Changes" : "Add Vendor"}</button>
                </div>
            </form>
        </Modal>
    );
};


const VendorsPage: React.FC = () => {
    const { suppliers, deleteSuppliers } = useData();
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Supplier | null>(null);
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

    const handleAddVendor = () => {
        setSelectedVendor(null);
        setModalOpen(true);
    };

    const handleEditVendor = (vendor: Supplier) => {
        setSelectedVendor(vendor);
        setModalOpen(true);
    };
    
    const handleConfirmDelete = () => {
        deleteSuppliers(selectedVendorIds);
        setSelectedVendorIds([]);
        setDeleteConfirmOpen(false);
    };
    
    const handleToggleAll = () => {
        if (selectedVendorIds.length === suppliers.length) {
            setSelectedVendorIds([]);
        } else {
            setSelectedVendorIds(suppliers.map(v => v.id));
        }
    };

    const handleToggleRow = (vendorId: string) => {
        setSelectedVendorIds(prev =>
            prev.includes(vendorId)
                ? prev.filter(id => id !== vendorId)
                : [...prev, vendorId]
        );
    };


    const columns = [
        { header: 'Vendor ID', accessor: 'id' as keyof Supplier, sortable: true },
        { header: 'Name', accessor: 'name' as keyof Supplier, sortable: true },
        { header: 'Contact Person', accessor: 'contactPerson' as keyof Supplier, sortable: true },
        { header: 'Email', accessor: 'email' as keyof Supplier, sortable: true },
        { header: 'Phone', accessor: 'phone' as keyof Supplier, sortable: true },
        { header: 'Address', accessor: 'address' as keyof Supplier, sortable: true },
    ];
    
    const renderActions = (vendor: Supplier) => (
        <div className="space-x-4">
            <button
                onClick={() => handleEditVendor(vendor)}
                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 font-medium"
            >
                Edit
            </button>
            <button
                onClick={() => {
                    setSelectedVendorIds([vendor.id]);
                    setDeleteConfirmOpen(true);
                }}
                className="text-red-600 hover:text-red-900 dark:text-red-400 font-medium"
            >
                Delete
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Vendors</h2>
                <button onClick={handleAddVendor} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Vendor
                </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 -mt-4">
                Manage your list of suppliers and vendors.
            </p>
            
            {selectedVendorIds.length > 0 && !isDeleteConfirmOpen && (
                 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-between no-print animate-fadeIn">
                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">{selectedVendorIds.length} vendor(s) selected</span>
                    <div className="space-x-2">
                        <button onClick={() => setDeleteConfirmOpen(true)} className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md shadow-sm hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">Delete Selected</button>
                    </div>
                </div>
            )}
            
            <DataTable 
                columns={columns} 
                data={suppliers}
                renderActions={renderActions}
                selection={{
                    selectedIds: selectedVendorIds,
                    onToggleAll: handleToggleAll,
                    onToggleRow: handleToggleRow,
                    allSelected: selectedVendorIds.length > 0 && selectedVendorIds.length === suppliers.length,
                }}
            />
            
            <AddEditVendorModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} vendor={selectedVendor} />

             <Modal isOpen={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion">
                <div>
                    <p>Are you sure you want to delete {selectedVendorIds.length} vendor(s)? This action cannot be undone.</p>
                    <div className="flex justify-end pt-4 space-x-2 mt-4">
                        <button onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default VendorsPage;