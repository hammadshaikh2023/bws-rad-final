import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import ExportDropdown from '../components/ExportDropdown';
import CurrencySelector from '../components/CurrencySelector';
import { useData } from '../context/DataContext';
import { Product, Currency, HistoryEntry, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { QrCodeIcon, PlusIcon, CloseIcon, SearchIcon, MinusIcon, ArrowUpIcon, ArrowDownIcon, PrinterIcon, DownloadIcon } from '../components/IconComponents';
import Dropdown from '../components/Dropdown';

const AddSupplierModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSupplierAdded: (name: string) => void;
}> = ({ isOpen, onClose, onSupplierAdded }) => {
    const { addSupplier } = useData();
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Supplier name cannot be empty.");
            return;
        }
        const newSupplierData = { name, contactPerson, email, phone };
        const newSupplier = addSupplier(newSupplierData);
        onSupplierAdded(newSupplier.name);
        onClose();
        // Reset form
        setName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Supplier">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person (Optional)</label>
                    <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Optional)</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone (Optional)</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Supplier</button>
                </div>
            </form>
        </Modal>
    );
};


export const AddEditProductModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    product: Product | null,
}> = ({ isOpen, onClose, product }) => {
    
    const { addProduct, updateProduct, categories, suppliers } = useData();
    const { defaultCurrency } = useSettings();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [showHistory, setShowHistory] = useState(false);
    const [errors, setErrors] = useState<{ expires?: string; stock?: string }>({});
    const [isAddSupplierModalOpen, setAddSupplierModalOpen] = useState(false);

    const supplierOptions = useMemo(() => {
        return suppliers.map(s => ({ value: s.name, label: s.name }));
    }, [suppliers]);

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({
                dateAdded: new Date().toISOString().split('T')[0],
                qualityTestStatus: 'Pending',
                status: 'In Stock',
                currency: defaultCurrency,
                batchNumber: '', // Start with empty batch number
                description: '',
                location: '',
                reorderLevel: undefined,
            });
        }
        setShowHistory(false); // Reset history view on modal open/product change
        setErrors({});
    }, [product, isOpen, defaultCurrency]);
    
    const handleSupplierAdded = (supplierName: string) => {
        setFormData(prev => ({ ...prev, supplier: supplierName }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'expires') {
            setErrors(prev => ({ ...prev, expires: undefined }));
        }

        if (name === 'stock') {
            const numValue = Number(value);
            if (value !== '' && (!Number.isInteger(numValue) || numValue < 0)) {
                setErrors(prev => ({ ...prev, stock: 'Quantity must be a positive integer.' }));
            } else {
                setErrors(prev => ({ ...prev, stock: undefined }));
            }
            if (value === '') {
                setFormData(prev => ({ ...prev, stock: undefined }));
            } else if (!isNaN(numValue)) {
                setFormData(prev => ({ ...prev, stock: numValue }));
            }
        } else if (name === 'price' || name === 'unitCost' || name === 'reorderLevel') {
            if (value === '') {
                setFormData(prev => ({ ...prev, [name]: undefined }));
            } else {
                const numericValue = parseFloat(value);
                setFormData(prev => ({ ...prev, [name]: isNaN(numericValue) || numericValue < 0 ? 0 : numericValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleCurrencyChange = (currency: Currency) => {
        setFormData(prev => ({ ...prev, currency }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, imageUrl: undefined }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const stockValue = formData.stock;
        const stockNum = Number(stockValue);
        if (stockValue === undefined || stockValue === null || !Number.isInteger(stockNum) || stockNum < 0) {
            setErrors(prev => ({ ...prev, stock: 'Quantity must be a positive integer.' }));
            return;
        }
        
        if (formData.expires) {
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            if (formData.expires < todayStr) {
                setErrors({ expires: 'Expiration date cannot be in the a past.' });
                return;
            }
        }
        
        const finalData = { ...formData, stock: stockNum };

        if (product) {
            if (currentUser) {
                 const currentStock = product.stock;
                 const newStock = finalData.stock;

                 if (currentStock !== newStock) {
                    const newHistoryEntry: HistoryEntry = {
                        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                        action: `Stock adjusted to ${newStock} (was ${currentStock}) via product edit.`,
                        user: currentUser.name,
                    };
                    finalData.history = [newHistoryEntry, ...(product.history || [])];
                 }
            }
            updateProduct(finalData as Product, currentUser?.name);
        } else {
            addProduct(finalData as Omit<Product, 'id'>);
        }
        onClose();
    }
    
    const handleStockChange = (delta: number) => {
        setErrors(prev => ({ ...prev, stock: undefined }));
        setFormData(prev => {
            const currentStock = Number(prev.stock) || 0;
            const newStock = Math.max(0, currentStock + delta); // Prevent negative stock
            return { ...prev, stock: newStock };
        });
    };

    const handleAutoGenerateBatchNumber = () => {
        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newBatchNumber = `BN-${yyyymmdd}-${randomChars}`;
        setFormData(prev => ({ ...prev, batchNumber: newBatchNumber }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? "Edit Product" : "Add New Product"}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
                        <input type="text" name="sku" value={formData.sku || ''} onChange={handleChange} required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Description</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} placeholder="Enter a detailed description..."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select name="category" value={formData.category || ''} onChange={handleChange} required>
                            <option value="">Select Category</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Warehouse</label>
                        <select name="warehouse" value={formData.warehouse || ''} onChange={handleChange} required>
                             <option value="">Select Warehouse</option>
                             <option value="Quarry Site A">Quarry Site A</option>
                             <option value="Main Plant">Main Plant</option>
                             <option value="Quarry Site B">Quarry Site B</option>
                             <option value="Testing Lab">Testing Lab</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location in Warehouse</label>
                        <input type="text" name="location" value={formData.location || ''} onChange={handleChange} placeholder="e.g., Aisle 5, Rack 3" />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Quantity</label>
                            <div className="flex items-center mt-1">
                                <button
                                    type="button"
                                    onClick={() => handleStockChange(-1)}
                                    className="px-3 py-3 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:z-10"
                                    aria-label="Decrease stock quantity by one"
                                >
                                    <MinusIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock ?? ''}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="1"
                                    className="w-full text-center font-medium border-t border-b border-gray-300 dark:border-gray-600 py-3 px-0 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 rounded-none dark:bg-gray-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleStockChange(1)}
                                    className="px-3 py-3 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:z-10"
                                    aria-label="Increase stock quantity by one"
                                >
                                    <PlusIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>
                            {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                            {formData.unitOfMeasure === 'Ton' && formData.stock !== undefined && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    = {(Number(formData.stock) * 1000).toLocaleString()} kg
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reorder Level</label>
                            <input type="number" name="reorderLevel" value={formData.reorderLevel ?? ''} onChange={handleChange} placeholder="e.g., 100" min="0" step="1" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit of Measure</label>
                             <select name="unitOfMeasure" value={formData.unitOfMeasure || ''} onChange={handleChange} required>
                                <option value="">Select Unit</option>
                                <option value="Ton">Ton</option>
                                <option value="Cubic Meter">Cubic Meter</option>
                                <option value="Bag">Bag</option>
                                <option value="Drum">Drum</option>
                            </select>
                        </div>
                    </div>
                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price per Unit</label>
                             <input type="number" name="price" step="0.01" value={formData.price || ''} onChange={handleChange} required />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Cost</label>
                            <input type="number" name="unitCost" step="0.01" value={formData.unitCost || ''} onChange={handleChange} required />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                            <CurrencySelector value={formData.currency || 'USD'} onChange={handleCurrencyChange} />
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier</label>
                        <div className="mt-1 flex items-center space-x-2">
                            <Dropdown
                                options={supplierOptions}
                                value={formData.supplier || ''}
                                onChange={(selectedSupplier) => setFormData(prev => ({ ...prev, supplier: selectedSupplier }))}
                                placeholder="Select or search for a supplier"
                                wrapperClassName="flex-grow"
                            />
                            <button
                                type="button"
                                onClick={() => setAddSupplierModalOpen(true)}
                                className="flex-shrink-0 p-3 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                title="Add New Supplier"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batch Number</label>
                            <button
                                type="button"
                                onClick={handleAutoGenerateBatchNumber}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                            >
                                Auto Generate
                            </button>
                        </div>
                        <input
                            id="batchNumber"
                            type="text"
                            name="batchNumber"
                            value={formData.batchNumber || ''}
                            onChange={handleChange}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quality Test Status</label>
                         <select name="qualityTestStatus" value={formData.qualityTestStatus || ''} onChange={handleChange} required>
                            <option value="Pending">Pending</option>
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Added</label>
                        <input type="date" name="dateAdded" value={formData.dateAdded || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiration Date (Optional)</label>
                        <input type="date" name="expires" value={formData.expires || ''} onChange={handleChange} />
                        {errors.expires && <p className="text-red-500 text-xs mt-1">{errors.expires}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
                        <div className="mt-1 flex items-center space-x-4">
                            {formData.imageUrl && (
                                <img src={formData.imageUrl} alt="Product Preview" className="h-20 w-20 object-cover rounded-md" />
                            )}
                            <div className="flex flex-col space-y-2">
                                <input
                                    type="file"
                                    id="image-upload"
                                    name="imageUrl"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    Upload Image
                                </label>
                                {formData.imageUrl && (
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {product?.history && product.history.length > 0 && (
                    <div className="md:col-span-2 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center"
                        >
                            {showHistory ? 'Hide' : 'Show'} Stock History
                            {showHistory ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />}
                        </button>
                        {showHistory && (
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded-md border dark:border-gray-700">
                                {product.history.map((entry, index) => (
                                    <div key={index} className="text-xs p-1.5 rounded bg-white dark:bg-gray-800">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{entry.action}</p>
                                        <p className="text-gray-500 dark:text-gray-400">{entry.user} - {new Date(entry.timestamp).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}


                <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Product</button>
                </div>
            </form>
             <AddSupplierModal
                isOpen={isAddSupplierModalOpen}
                onClose={() => setAddSupplierModalOpen(false)}
                onSupplierAdded={handleSupplierAdded}
            />
        </Modal>
    );
};


const UpdateStockModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    initialAction: 'add' | 'remove';
}> = ({ isOpen, onClose, product, initialAction }) => {
    const { updateProductStock } = useData();
    const { currentUser } = useAuth();
    const [quantity, setQuantity] = useState(1);
    const [action, setAction] = useState<'add' | 'remove'>(initialAction);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setAction(initialAction);
            setReason('');
        }
    }, [isOpen, initialAction]);

    if (!product) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalReason = reason.trim() || 'Manual stock adjustment'; // Default reason if none provided
        const quantityChange = action === 'add' ? quantity : -quantity;
        if (currentUser) {
            updateProductStock(product.id, quantityChange, finalReason, currentUser.name);
        }
        onClose();
    };
    
    const maxRemove = product.stock;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update Stock for ${product.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {product.unitOfMeasure === 'Ton' ? (
                    <p>Current stock: <strong className="text-indigo-600 dark:text-indigo-400">{product.stock.toLocaleString()} Ton</strong> ({(product.stock * 1000).toLocaleString()} kg)</p>
                ) : (
                    <p>Current stock: <strong className="text-indigo-600 dark:text-indigo-400">{product.stock.toLocaleString()}</strong> {product.unitOfMeasure}{product.stock !== 1 ? 's' : ''}</p>
                )}
                <div className="flex items-center space-x-4">
                    <select value={action} onChange={e => setAction(e.target.value as 'add' | 'remove')}>
                        <option value="add">Add Stock</option>
                        <option value="remove">Remove Stock</option>
                    </select>
                    <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max={action === 'remove' ? maxRemove : undefined}
                        required
                    />
                </div>
                {action === 'remove' && quantity > maxRemove && (
                    <p className="text-sm text-red-500">Cannot remove more stock than is available.</p>
                )}
                <div>
                    <label htmlFor="stock-adjustment-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Adjustment (Optional)</label>
                    <textarea
                        id="stock-adjustment-reason"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full"
                        placeholder="e.g., Damaged stock, Received from PO #123, Manual correction..."
                    />
                </div>
                 <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" disabled={action === 'remove' && quantity > maxRemove} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">Confirm Update</button>
                </div>
            </form>
        </Modal>
    );
};

const ProductQrCodeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}> = ({ isOpen, onClose, product }) => {
    if (!isOpen || !product) return null;

    const qrData = JSON.stringify({ productId: product.id, sku: product.sku });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print QR Code for ${product.name}</title>
                        <style>
                            body { font-family: sans-serif; text-align: center; padding: 20px; }
                            img { max-width: 100%; height: auto; }
                            @media print {
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <h2>${product.name}</h2>
                        <p><strong>SKU:</strong> ${product.sku}</p>
                        <img src="${qrCodeUrl}" alt="QR Code" />
                        <br />
                        <button class="no-print" onclick="window.print()">Print</button>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleDownload = async () => {
        if (!product) return;
        try {
            const response = await fetch(qrCodeUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${product.sku}_qrcode.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading the QR code:', error);
            alert('Could not download the QR code. Please check your network connection and try again.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`QR Code for ${product.name}`}>
            <div className="text-center">
                <p className="mb-2"><strong>SKU:</strong> {product.sku}</p>
                <div className="flex justify-center my-4">
                    <img src={qrCodeUrl} alt={`QR Code for ${product.name}`} className="w-48 h-48 border p-2 rounded-md bg-white"/>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scan this code to get product ID and SKU.</p>
                <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Close</button>
                    <button onClick={handleDownload} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Print
                    </button>
                </div>
            </div>
        </Modal>
    );
};


// Custom hook for debouncing a value.
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the specified delay.
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value or delay changes before the timer fires.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Only re-call effect if value or delay changes

    return debouncedValue;
}

const getExpiryStatus = (item: Product): number => {
    if (!item.expires) {
        return 3; // No expiry date, sort last
    }
    const expiryDate = new Date(item.expires);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
        return 0; // Expired, sort first
    }
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    if (expiryDate <= thirtyDaysFromNow) {
        return 1; // Expiring soon, sort second
    }

    return 2; // Not expiring soon, sort third
};

const qualitySortOrder: Record<Product['qualityTestStatus'], number> = {
    'Failed': 0,
    'Pending': 1,
    'Passed': 2,
};


const InventoryPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { products, deleteProducts, updateProductStatus, categories, suppliers } = useData();
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
    const [isUpdateStockModalOpen, setUpdateStockModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [initialStockAction, setInitialStockAction] = useState<'add' | 'remove'>('add');
    const [isQrModalOpen, setQrModalOpen] = useState(false);
    const [productForQr, setProductForQr] = useState<Product | null>(null);
    
    // State for bulk action modals
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isStatusUpdateOpen, setStatusUpdateOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<Product['status']>('In Stock');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // State for user inputs
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [expiryFilter, setExpiryFilter] = useState('All');
    const [supplierFilter, setSupplierFilter] = useState('All');

    // Debounce the search term to avoid excessive re-renders on each keystroke
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredProducts = useMemo(() => {
        return products
            .map(p => ({
                ...p,
                profitMargin: p.price > 0 ? ((p.price - p.unitCost) / p.price) * 100 : 0
            }))
            .filter(p => statusFilter === 'All' || p.status === statusFilter)
            .filter(p => categoryFilter === 'All' || p.category === categoryFilter)
            .filter(p => supplierFilter === 'All' || p.supplier === supplierFilter)
            .filter(p => {
                if (expiryFilter === 'All') return true;
                const expiryStatus = getExpiryStatus(p);
                if (expiryFilter === 'Expiring Soon') return expiryStatus === 1;
                if (expiryFilter === 'Expired') return expiryStatus === 0;
                return false;
            })
            .filter(p => 
                p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                p.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                p.batchNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );
    }, [products, debouncedSearchTerm, statusFilter, categoryFilter, expiryFilter, supplierFilter]);
    
    const categoryOptions = useMemo(() => {
        return [{ value: 'All', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]
    }, [categories]);

    const supplierOptions = useMemo(() => {
        return [{ value: 'All', label: 'All Suppliers' }, ...suppliers.map(s => ({ value: s.name, label: s.name }))]
    }, [suppliers]);


    const statusOptions = [
        { value: 'All', label: 'All Statuses' },
        { value: 'In Stock', label: 'In Stock' },
        { value: 'Low Stock', label: 'Low Stock' },
        { value: 'Out of Stock', label: 'Out of Stock' }
    ];

    // Calculate counts for expiry filter options
    const expiryCounts = useMemo(() => {
        const counts = {
            expired: 0,
            expiringSoon: 0,
        };
        products.forEach(p => {
            const status = getExpiryStatus(p);
            if (status === 0) counts.expired++;
            if (status === 1) counts.expiringSoon++;
        });
        return counts;
    }, [products]);
    
    const expiryOptions = [
        { value: 'All', label: 'All Expiry Statuses' },
        { value: 'Expiring Soon', label: `Expiring Soon (${expiryCounts.expiringSoon})` },
        { value: 'Expired', label: `Expired (${expiryCounts.expired})` }
    ];

    const totalStockValue = useMemo(() => {
        return filteredProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
    }, [filteredProducts]);


    const handleAddProduct = () => {
        setSelectedProduct(null);
        setAddEditModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setAddEditModalOpen(true);
    };

    const handleUpdateStock = (product: Product, action: 'add' | 'remove') => {
        setSelectedProduct(product);
        setInitialStockAction(action);
        setUpdateStockModalOpen(true);
    };

    const handleGenerateQr = (product: Product) => {
        setProductForQr(product);
        setQrModalOpen(true);
    };
    
    // Selection Handlers
    const handleToggleAll = () => {
        if (selectedProductIds.length === filteredProducts.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(filteredProducts.map(p => p.id));
        }
    };

    const handleToggleRow = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };
    
    // Bulk Action Handlers
    const handleConfirmDelete = () => {
        deleteProducts(selectedProductIds);
        setSelectedProductIds([]);
        setDeleteConfirmOpen(false);
    };

    const handleConfirmStatusUpdate = () => {
        setIsUpdatingStatus(true);
        // Simulate API call for better UX
        setTimeout(() => {
            updateProductStatus(selectedProductIds, newStatus);
            setSelectedProductIds([]);
            setStatusUpdateOpen(false);
            setIsUpdatingStatus(false);
        }, 500);
    };

    const getRowClassName = (item: Product): string => {
        const status = getExpiryStatus(item);
        if (status === 0) { // Expired
            return 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70';
        }
        if (status === 1) { // Expiring Soon
            return 'bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-900/70';
        }
        return '';
    };

    const columns = [
        { 
            header: 'Image', 
            accessor: 'imageUrl' as keyof Product,
            render: (item: Product) => (
                item.imageUrl ?
                <img src={item.imageUrl} alt={item.name} className="h-10 w-10 object-cover rounded-md" />
                : <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500">No Img</div>
            )
        },
        { header: 'SKU', accessor: 'sku' as keyof Product, sortable: true },
        { 
            header: 'Batch #', 
            accessor: 'batchNumber' as keyof Product, 
            sortable: true,
            sortFn: (a: Product, b: Product) => {
                const batchA = a.batchNumber || '';
                const batchB = b.batchNumber || '';
            
                // Extracts parts: PREFIX-DATE-SUFFIX
                const partsA = batchA.split('-');
                const partsB = batchB.split('-');
            
                // Compare date parts if they exist and are valid-looking dates (e.g., YYYYMMDD)
                const datePartA = partsA.length > 1 ? partsA[1] : '';
                const datePartB = partsB.length > 1 ? partsB[1] : '';
                if (/^\d{8}$/.test(datePartA) && /^\d{8}$/.test(datePartB)) {
                    const dateCompare = datePartA.localeCompare(datePartB);
                    if (dateCompare !== 0) return dateCompare;
                }
            
                // Custom parser for the suffix (alphanumeric part like 'A10')
                const parseSuffix = (suffix: string | undefined) => {
                    if (!suffix) return { str: '', num: 0 };
                    // Match an optional string part and an optional number part
                    const match = suffix.match(/^([a-zA-Z]*)(\d*)$/);
                    if (match) {
                        return {
                            str: match[1] || '',
                            num: parseInt(match[2] || '0', 10)
                        };
                    }
                    return { str: suffix, num: 0 }; // Fallback for unexpected formats
                };
                
                const suffixPartA = parseSuffix(partsA.length > 2 ? partsA[2] : undefined);
                const suffixPartB = parseSuffix(partsB.length > 2 ? partsB[2] : undefined);
                
                // Compare the string part of the suffix first (e.g., 'A' vs 'B')
                if (suffixPartA.str !== suffixPartB.str) {
                    return suffixPartA.str.localeCompare(suffixPartB.str);
                }
                
                // If string parts are the same, compare the numeric part (e.g., 10 vs 2)
                if (suffixPartA.num !== suffixPartB.num) {
                    return suffixPartA.num - suffixPartB.num;
                }
                
                // Fallback to full string natural sort if logic above is inconclusive
                return batchA.localeCompare(batchB, undefined, { numeric: true, sensitivity: 'base' });
            }
        },
        { header: 'Product Name', accessor: 'name' as keyof Product, sortable: true },
        { header: 'Category', accessor: 'category' as keyof Product, sortable: true },
        { 
            header: 'Stock Quantity', 
            accessor: 'stock' as keyof Product, 
            sortable: true, 
            render: (item: Product) => {
                if (item.unitOfMeasure === 'Ton') {
                    const kg = item.stock * 1000;
                    return (
                        <div>
                            <span>{item.stock.toLocaleString()}</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                ({kg.toLocaleString()} kg)
                            </span>
                        </div>
                    );
                }
                return item.stock.toLocaleString();
            } 
        },
        { header: 'Unit of Measure', accessor: 'unitOfMeasure' as keyof Product, sortable: true },
        { header: 'Price', accessor: 'price' as keyof Product, sortable: true, render: (item: Product) => `${item.currency} ${item.price.toFixed(2)}` },
        { 
            header: 'Profit Margin', 
            accessor: 'profitMargin' as keyof Product, 
            sortable: true, 
            render: (item: Product) => {
                if (item.price === 0) {
                    return <span className="text-gray-500">N/A</span>;
                }
                const margin = item.profitMargin!;
                const color = margin >= 30 ? 'text-green-500' 
                            : margin >= 15 ? 'text-yellow-500' 
                            : 'text-red-500';
                return <span className={`font-medium ${color}`}>{margin.toFixed(1)}%</span>;
            }
        },
        { header: 'Warehouse', accessor: 'warehouse' as keyof Product, sortable: true },
        { header: 'Date Added', accessor: 'dateAdded' as keyof Product, sortable: true },
        { 
            header: 'Expires', 
            accessor: 'expires' as keyof Product, 
            sortable: true, 
            sortFn: (a: Product, b: Product) => {
                const statusA = getExpiryStatus(a);
                const statusB = getExpiryStatus(b);
    
                if (statusA !== statusB) {
                    return statusA - statusB;
                }
    
                if (statusA === 3) { // Both have no expiry date
                    return 0;
                }
                
                // Both have expiry dates and same status.
                const dateA = new Date(a.expires!).getTime();
                const dateB = new Date(b.expires!).getTime();
                
                return dateA - dateB;
            },
            render: (item: Product) => {
                if (!item.expires) {
                    return <span className="text-gray-500">N/A</span>;
                }
                const expiryDate = new Date(item.expires);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today's date
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(today.getDate() + 30);
                
                let color = 'text-gray-800 dark:text-gray-200';
                if (expiryDate < today) {
                    color = 'text-red-600 dark:text-red-400 font-bold'; // Expired
                } else if (expiryDate <= thirtyDaysFromNow) {
                    color = 'text-yellow-600 dark:text-yellow-400 font-semibold'; // Expiring soon
                }
    
                return <span className={color}>{item.expires}</span>;
            }
        },
        { header: 'Status', accessor: 'status' as keyof Product, sortable: true, render: (item: Product) => {
            const color = item.status === 'In Stock' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{item.status}</span>;
        }},
         { 
            header: 'Quality', 
            accessor: 'qualityTestStatus' as keyof Product, 
            sortable: true, 
            sortFn: (a: Product, b: Product) => {
                return (qualitySortOrder[a.qualityTestStatus] ?? 99) - (qualitySortOrder[b.qualityTestStatus] ?? 99);
            },
            render: (item: Product) => {
                const color = item.qualityTestStatus === 'Passed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                            : item.qualityTestStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
                return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{item.qualityTestStatus}</span>;
            }
        },
    ];

    const renderActions = (item: Product) => {
        const canUpdateStock = currentUser?.roles.includes('Admin') || currentUser?.roles.includes('Inventory Manager');
        if (!canUpdateStock) return null;
        
        return (
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => handleUpdateStock(item, 'add')}
                    className="p-1 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-gray-700"
                    title="Add Stock">
                    <PlusIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleUpdateStock(item, 'remove')}
                    className="p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-gray-700"
                    title="Remove Stock">
                    <MinusIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleGenerateQr(item)}
                    className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700"
                    title="Generate QR Code">
                    <QrCodeIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleEditProduct(item)}
                    className="p-1 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-gray-700"
                    title="Edit Product">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Inventory</h2>
                <div className="flex items-center space-x-2 no-print">
                    <ExportDropdown data={filteredProducts} columns={columns.filter(c => c.accessor !== 'imageUrl')} fileName="Inventory_Report" />
                    {(currentUser?.roles.includes('Admin') || currentUser?.roles.includes('Inventory Manager')) && (
                        <button onClick={handleAddProduct} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add Product
                        </button>
                    )}
                </div>
            </div>
            
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-center">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-center">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Stock Value</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-center">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Items</h4>
                    <p className="text-2xl font-bold text-yellow-500">{products.filter(p => p.status === 'Low Stock').length}</p>
                </div>
            </div>

            {/* Filters and Search section */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg no-print">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
                    {/* Search and Scan Group */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <SearchIcon className="w-5 h-5 text-gray-400" />
                                </span>
                                <input
                                    id="inventory-search"
                                    type="text"
                                    placeholder="Search by Name, Batch # or SKU..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <button
                                onClick={() => setScannerOpen(true)}
                                className="flex-shrink-0 flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                aria-label="Scan item barcode"
                            >
                                <QrCodeIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <Dropdown options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} />
                    <Dropdown options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                    <Dropdown options={expiryOptions} value={expiryFilter} onChange={setExpiryFilter} />
                    <Dropdown options={supplierOptions} value={supplierFilter} onChange={setSupplierFilter} />
                </div>
            </div>
            
            {/* Bulk actions bar */}
            {selectedProductIds.length > 0 && (
                 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-between no-print animate-fadeIn">
                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">{selectedProductIds.length} item(s) selected</span>
                    <div className="space-x-2">
                        <button onClick={() => setStatusUpdateOpen(true)} className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-white rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Update Status</button>
                        <button onClick={() => setDeleteConfirmOpen(true)} className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md shadow-sm hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">Delete Selected</button>
                    </div>
                </div>
            )}

            <DataTable
                columns={columns}
                data={filteredProducts}
                renderActions={renderActions}
                onViewDetails={handleEditProduct}
                selection={{
                    selectedIds: selectedProductIds,
                    onToggleAll: handleToggleAll,
                    onToggleRow: handleToggleRow,
                    allSelected: selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length
                }}
                rowClassName={getRowClassName}
            />

            {/* Modals */}
            <AddEditProductModal isOpen={isAddEditModalOpen} onClose={() => setAddEditModalOpen(false)} product={selectedProduct} />
            <UpdateStockModal isOpen={isUpdateStockModalOpen} onClose={() => setUpdateStockModalOpen(false)} product={selectedProduct} initialAction={initialStockAction} />
            <Modal isOpen={isScannerOpen} onClose={() => setScannerOpen(false)} title="Scan Barcode">
                <BarcodeScanner />
            </Modal>
            <ProductQrCodeModal isOpen={isQrModalOpen} onClose={() => setQrModalOpen(false)} product={productForQr} />
            <Modal isOpen={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion">
                <div>
                    <p>Are you sure you want to delete {selectedProductIds.length} product(s)? This action cannot be undone.</p>
                    <div className="flex justify-end pt-4 space-x-2 mt-4">
                        <button onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isStatusUpdateOpen} onClose={() => setStatusUpdateOpen(false)} title="Update Status">
                <div>
                    <p>Update status for {selectedProductIds.length} selected product(s):</p>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as Product['status'])} className="mt-2 w-full">
                         <option value="In Stock">In Stock</option>
                         <option value="Low Stock">Low Stock</option>
                         <option value="Out of Stock">Out of Stock</option>
                    </select>
                     <div className="flex justify-end pt-4 space-x-2 mt-4">
                        <button onClick={() => setStatusUpdateOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={handleConfirmStatusUpdate} disabled={isUpdatingStatus} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
                           {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </div>
            </Modal>
            <div id="print-header" className="hidden print-block">
                <h1 className="text-2xl font-bold">Inventory Report</h1>
                <p>Generated on: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default InventoryPage;