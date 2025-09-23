import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { Supplier } from '../types';
import { PlusIcon } from '../components/IconComponents';

const AddEditVendorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    vendor: Supplier | null;
}> = ({ isOpen, onClose, vendor }) => {
    const { addSupplier, updateSupplier } = useData();
    const [formData, setFormData] = useState<Partial<Supplier>>({});

    React.useEffect(() => {
        if (vendor) {
            setFormData(vendor);
        } else {
            setFormData({
                name: '',
                contactPerson: '',
                email: '',
                phone: '',
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

        if (vendor) {
            updateSupplier(formData as Supplier);
        } else {
            addSupplier(formData as Omit<Supplier, 'id'>);
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
            
            {selectedVendorIds.length > 0 && (
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
                onViewDetails={handleEditVendor}
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