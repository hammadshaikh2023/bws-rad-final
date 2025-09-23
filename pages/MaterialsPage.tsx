import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { RawMaterial, Supplier } from '../types';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { PlusIcon } from '../components/IconComponents';

type Tab = 'mixDesign' | 'list';

const MixDesignView: React.FC = () => {
    const { rawMaterials, updateRawMaterial } = useData();
    // Filter for materials that are part of the mix design (unit: Percent)
    const mixDesignMaterials = rawMaterials.filter(rm => rm.unitOfMeasure === 'Percent');

    const [mix, setMix] = useState<RawMaterial[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (mixDesignMaterials.length > 0) {
            setMix(JSON.parse(JSON.stringify(mixDesignMaterials)));
        }
    }, [rawMaterials]);

    const handlePercentageChange = (id: string, value: string) => {
        setIsDirty(true);
        const newPercentage = parseFloat(value);
        setMix(prevMix =>
            prevMix.map(material =>
                material.id === id ? { ...material, stock: isNaN(newPercentage) ? 0 : newPercentage } : material
            )
        );
    };

    const totalPercentage = useMemo(() => {
        return mix.reduce((total, material) => total + (material.stock || 0), 0);
    }, [mix]);

    const handleSaveChanges = () => {
        if (Math.abs(totalPercentage - 100) > 0.01) {
            if (!window.confirm(`Total is ${totalPercentage.toFixed(2)}%, not 100%. Do you still want to save?`)) {
                return;
            }
        }
        mix.forEach(material => {
            const originalMaterial = rawMaterials.find(rm => rm.id === material.id);
            if (originalMaterial && originalMaterial.stock !== material.stock) {
                 updateRawMaterial(material);
            }
        });
        setIsDirty(false);
        alert('Mix design saved successfully!');
    };
    
    const handleResetChanges = () => {
        setMix(JSON.parse(JSON.stringify(mixDesignMaterials)));
        setIsDirty(false);
    };

    const aggregates = mix.filter(m => m.category === 'Aggregates');
    const water = mix.find(m => m.category === 'Liquid');

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 max-w-2xl mx-auto animate-fadeIn">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Configure the percentage of raw materials for the standard mix. These values are defaults and do not reflect inventory stock.
            </p>
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">Category: Aggregates</h3>
                    {aggregates.map(material => (
                        <div key={material.id} className="grid grid-cols-2 items-center gap-4 mb-3">
                            <label htmlFor={`material-${material.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {material.name}
                            </label>
                            <div className="relative">
                                <input id={`material-${material.id}`} type="number" step="0.01" value={material.stock} onChange={(e) => handlePercentageChange(material.id, e.target.value)} className="w-full text-right pr-8" />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">%</span>
                            </div>
                        </div>
                    ))}
                </div>
                {water && (
                     <div>
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">Other</h3>
                         <div key={water.id} className="grid grid-cols-2 items-center gap-4">
                            <label htmlFor={`material-${water.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">{water.name}</label>
                            <div className="relative">
                                <input id={`material-${water.id}`} type="number" step="0.01" value={water.stock} onChange={(e) => handlePercentageChange(water.id, e.target.value)} className="w-full text-right pr-8" />
                                 <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">%</span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="border-t-2 border-dashed pt-4 mt-4">
                     <div className="grid grid-cols-2 items-center gap-4">
                         <span className="text-base font-bold text-gray-800 dark:text-white">Total</span>
                        <div className={`text-right font-bold text-lg ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                             {totalPercentage.toFixed(2)} %
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-6 space-x-2 mt-4 border-t dark:border-gray-700">
                <button onClick={handleResetChanges} disabled={!isDirty} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">Reset</button>
                <button onClick={handleSaveChanges} disabled={!isDirty} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Save Changes</button>
            </div>
        </div>
    );
};

const AddEditRawMaterialModal: React.FC<{ isOpen: boolean; onClose: () => void; material: RawMaterial | null; }> = ({ isOpen, onClose, material }) => {
    const { addRawMaterial, updateRawMaterial, suppliers } = useData();
    const [formData, setFormData] = useState<Partial<RawMaterial>>({});

    useEffect(() => {
        if (material) {
            setFormData(material);
        } else {
            setFormData({
                name: '', category: 'Aggregates', stock: 0, unitOfMeasure: 'Ton',
                supplierId: suppliers.length > 0 ? suppliers[0].id : '',
                dateAdded: new Date().toISOString().split('T')[0],
                description: '',
            });
        }
    }, [material, isOpen, suppliers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'stock' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (material) {
            updateRawMaterial(formData as RawMaterial);
        } else {
            addRawMaterial(formData as Omit<RawMaterial, 'id'>);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={material ? 'Edit Raw Material' : 'Add New Raw Material'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Material Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Category</label>
                        <input type="text" name="category" value={formData.category || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">
                            {formData.unitOfMeasure === 'Percent' ? 'Percentage (%)' : 'Stock Quantity'}
                        </label>
                        <input type="number" name="stock" value={formData.stock ?? ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Unit of Measure</label>
                        <select name="unitOfMeasure" value={formData.unitOfMeasure || ''} onChange={handleChange} required>
                            <option value="Ton">Ton</option>
                            <option value="Cubic Meter">Cubic Meter</option>
                            <option value="Bag">Bag</option>
                            <option value="Drum">Drum</option>
                            <option value="Liter">Liter</option>
                            <option value="Kilogram">Kilogram</option>
                            <option value="Percent">Percent (for Mix Design)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Supplier</label>
                        <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} required>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Description</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3}></textarea>
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{material ? 'Save Changes' : 'Add Material'}</button>
                </div>
            </form>
        </Modal>
    );
};

const RawMaterialsListView: React.FC = () => {
    const { rawMaterials, deleteRawMaterials, suppliers } = useData();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);

    const handleAdd = () => {
        setSelectedMaterial(null);
        setModalOpen(true);
    };

    const handleEdit = (material: RawMaterial) => {
        setSelectedMaterial(material);
        setModalOpen(true);
    };

    const handleDelete = (material: RawMaterial) => {
        if (window.confirm(`Are you sure you want to delete ${material.name}?`)) {
            deleteRawMaterials([material.id]);
        }
    };
    
    const getSupplierName = (supplierId: string) => {
        return suppliers.find(s => s.id === supplierId)?.name || 'Unknown';
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof RawMaterial, sortable: true },
        { header: 'Name', accessor: 'name' as keyof RawMaterial, sortable: true },
        { header: 'Category', accessor: 'category' as keyof RawMaterial, sortable: true },
        { 
            header: '%', 
            accessor: 'stock' as keyof RawMaterial, 
            sortable: true, 
            render: (item: RawMaterial) => {
                if (item.unitOfMeasure === 'Percent') {
                    return `${item.stock.toLocaleString()}%`;
                }
                return `${item.stock.toLocaleString()} ${item.unitOfMeasure}`;
            } 
        },
        { header: 'Supplier', accessor: 'supplierId' as keyof RawMaterial, sortable: true, render: (item: RawMaterial) => getSupplierName(item.supplierId) },
        { header: 'Date Added', accessor: 'dateAdded' as keyof RawMaterial, sortable: true },
    ];

    const renderActions = (item: RawMaterial) => (
        <div className="space-x-2">
            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Edit</button>
            <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-900 dark:text-red-400">Delete</button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Manage a complete list of all raw materials in your inventory.</p>
                <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Raw Material
                </button>
            </div>
            <DataTable columns={columns} data={rawMaterials} renderActions={renderActions} />
            <AddEditRawMaterialModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} material={selectedMaterial} />
        </div>
    );
};


const MaterialsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('list');

    const TabButton: React.FC<{ tabId: Tab, children: React.ReactNode }> = ({ tabId, children }) => {
        const isActive = activeTab === tabId;
        return (
            <button
                onClick={() => setActiveTab(tabId)}
                className={`whitespace-nowrap py-3 px-4 font-medium text-sm focus:outline-none rounded-t-lg ${
                    isActive
                        ? 'bg-white dark:bg-gray-800 border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                {children}
            </button>
        );
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Materials</h2>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex justify-between items-center" aria-label="Tabs">
                    <div>
                        <TabButton tabId="list">Raw Materials List</TabButton>
                    </div>
                    <div>
                        <TabButton tabId="mixDesign">Mix Design</TabButton>
                    </div>
                </nav>
            </div>

            {/* Content */}
            <div className="mt-4">
                {activeTab === 'mixDesign' && <MixDesignView />}
                {activeTab === 'list' && <RawMaterialsListView />}
            </div>
        </div>
    );
};

export default MaterialsPage;