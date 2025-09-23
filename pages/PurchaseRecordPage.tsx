import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PurchaseTicket } from '../types';
import { PlusIcon, PrinterIcon, PdfIcon, ExcelIcon, EmailIcon, SearchIcon } from '../components/IconComponents';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BWS_LOGO_BASE64 } from '../assets/logoBase64';

// Custom hook for debouncing a value.
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

const AddEditPurchaseTicketModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    ticket: PurchaseTicket | null;
}> = ({ isOpen, onClose, ticket }) => {
    const { addPurchaseTicket, updatePurchaseTicket, purchaseTickets } = useData();
    const { currentUser } = useAuth();
    const isEditMode = !!ticket;
    
    const initialFormState: Partial<PurchaseTicket> = {
        id: '',
        serialNo: '',
        date: new Date().toISOString().split('T')[0],
        customerName: 'N/A',
        truckNo: '',
        origin: '', // Source
        transporter: 'RAD INTERNATIONAL',
        materialCode: '', // Materials
        timeIn: '',
        timeOut: '',
        temperature: undefined,
        tareWeight: 'N/A',
        poNo: '', // Order No
        grossWeight: 'N/A',
        driverName: '', // Truck Driver
        destination: 'DIC-100 ASPHALT PLANT',
        operatorName: 'N/A',
        status: 'Pending',
        notes: ''
    };

    const [formData, setFormData] = useState<Partial<PurchaseTicket>>(initialFormState);
    const [netWeight, setNetWeight] = useState<number | string>('N/A');
    const [ticketNoError, setTicketNoError] = useState<string | null>(null);

    const materialsList = [
        "0-5 mm (3/16\")",
        "5-10 mm (3/8\")",
        "10-20 mm (3/4\")",
        "20-40 mm (1 1/2\")"
    ];

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData(ticket);
                const gross = Number(ticket.grossWeight) || 0;
                const tare = Number(ticket.tareWeight) || 0;
                setNetWeight(gross > tare ? gross - tare : 0);
            } else {
                setFormData({ ...initialFormState, operatorName: currentUser?.name || 'N/A' });
                setNetWeight('N/A');
            }
            setTicketNoError(null);
        }
    }, [isOpen, ticket, isEditMode, currentUser]);

    useEffect(() => {
        const gross = formData.grossWeight;
        const tare = formData.tareWeight;

        if (gross === 'N/A' || tare === 'N/A') {
            setNetWeight('N/A');
        } else {
            const grossNum = Number(gross) || 0;
            const tareNum = Number(tare) || 0;
            setNetWeight(grossNum > tareNum ? grossNum - tareNum : 0);
        }
    }, [formData.grossWeight, formData.tareWeight]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'id' && !isEditMode) {
            if (purchaseTickets.some(ticket => ticket.id === value)) {
                setTicketNoError('This Ticket No already exists.');
            } else {
                setTicketNoError(null);
            }
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isEditMode && !formData.id) {
            setTicketNoError('Ticket No is required.');
            return;
        }

        if (ticketNoError) {
            alert('Please use a unique Ticket No.');
            return;
        }
        
        const ticketData: PurchaseTicket = {
            id: formData.id!,
            serialNo: formData.serialNo!,
            date: formData.date!,
            customerName: formData.customerName!,
            truckNo: formData.truckNo!,
            origin: formData.origin!,
            transporter: formData.transporter!,
            materialCode: formData.materialCode!,
            timeIn: formData.timeIn!,
            timeOut: formData.timeOut!,
            temperature: formData.temperature ? Number(formData.temperature) : undefined,
            tareWeight: formData.tareWeight!,
            poNo: formData.poNo!,
            grossWeight: formData.grossWeight!,
            netWeight,
            driverName: formData.driverName!,
            destination: formData.destination!,
            operatorName: formData.operatorName!,
            status: formData.status!,
            notes: formData.notes,
        };

        if (isEditMode) {
            updatePurchaseTicket(ticketData);
        } else {
            addPurchaseTicket(ticketData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Purchase Record" : "Create New Purchase Record"}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Ticket Number & Serial No */}
                    <div>
                        <label className="block text-sm font-medium">Ticket Number</label>
                        <input type="text" name="id" value={formData.id || ''} onChange={handleChange} required readOnly={isEditMode} className={isEditMode ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""} />
                        {ticketNoError && <p className="text-red-500 text-xs mt-1">{ticketNoError}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Serial No</label>
                        <input type="text" name="serialNo" value={formData.serialNo || ''} onChange={handleChange} required />
                    </div>

                    {/* Date & Customer */}
                    <div>
                        <label className="block text-sm font-medium">Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Customer</label>
                         <input type="text" name="customerName" value={formData.customerName || ''} onChange={handleChange} required />
                    </div>
                    
                    {/* Time In & Order No */}
                    <div>
                        <label className="block text-sm font-medium">Time In</label>
                        <input type="time" name="timeIn" value={formData.timeIn} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Order No</label>
                        <input type="text" name="poNo" value={formData.poNo} onChange={handleChange} />
                    </div>

                    {/* Time Out & Destination */}
                     <div>
                        <label className="block text-sm font-medium">Time Out</label>
                        <input type="time" name="timeOut" value={formData.timeOut} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Destination</label>
                        <input type="text" name="destination" value={formData.destination} onChange={handleChange} required />
                    </div>
                    
                    {/* Materials & Status */}
                    <div>
                        <label className="block text-sm font-medium">Materials</label>
                        <select name="materialCode" value={formData.materialCode} onChange={handleChange} required>
                            <option value="">Select Material</option>
                            {materialsList.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} required>
                            <option value="Pending">Pending</option>
                            <option value="Received">Received</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Transporter & Gross Weight */}
                    <div>
                        <label className="block text-sm font-medium">Transporter</label>
                        <input type="text" name="transporter" value={formData.transporter} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Gross Weight (kg)</label>
                        <input type="text" name="grossWeight" value={formData.grossWeight ?? ''} onChange={handleChange} required />
                    </div>

                    {/* Truck Number & Tare Weight */}
                    <div>
                        <label className="block text-sm font-medium">Truck Number</label>
                        <input type="text" name="truckNo" value={formData.truckNo} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tare Weight (kg)</label>
                        <input type="text" name="tareWeight" value={formData.tareWeight ?? ''} onChange={handleChange} required />
                    </div>

                    {/* Truck Driver & Net Weight */}
                    <div>
                        <label className="block text-sm font-medium">Truck Driver</label>
                        <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} />
                    </div>
                    <div>
                         <label className="block text-sm font-medium">Net Weight (kg)</label>
                         <input type="text" value={typeof netWeight === 'number' ? netWeight.toLocaleString() : netWeight} readOnly className="bg-gray-200 dark:bg-gray-600" />
                    </div>

                    {/* Source & Operator */}
                    <div>
                        <label className="block text-sm font-medium">Source</label>
                        <input type="text" name="origin" value={formData.origin} onChange={handleChange} required />
                    </div>
                    <div>
                         <label className="block text-sm font-medium">Operator</label>
                         <input type="text" name="operatorName" value={formData.operatorName} onChange={handleChange} readOnly={!!currentUser} className={currentUser ? "bg-gray-200 dark:bg-gray-600" : ""} />
                    </div>
                    
                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Note if any</label>
                        <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2}></textarea>
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-2 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{isEditMode ? 'Save Changes' : 'Save Record'}</button>
                </div>
            </form>
        </Modal>
    );
};

const ViewPurchaseTicketModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    ticket: PurchaseTicket | null;
}> = ({ isOpen, onClose, ticket }) => {
    if (!ticket) return null;

    const formatWeight = (weight: number | string) => {
        if (typeof weight === 'number') return weight.toLocaleString();
        return weight;
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.addImage(BWS_LOGO_BASE64, 'PNG', 15, 10, 40, 12);
        doc.setFontSize(20);
        doc.text("Purchase Ticket", 200, 20, { align: 'right' });
        doc.setFontSize(12);
        doc.text(`Ticket No: ${ticket.id}`, 200, 28, { align: 'right' });

        const tableBody = [
            ['Ticket Number', ticket.id],
            ['Serial No', ticket.serialNo],
            ['Date', ticket.date],
            ['Customer', ticket.customerName],
            ['Time In', ticket.timeIn],
            ['Order No', ticket.poNo],
            ['Time Out', ticket.timeOut],
            ['Destination', ticket.destination],
            ['Materials', ticket.materialCode],
            ['Transporter', ticket.transporter],
            ['Gross Weight (kg)', formatWeight(ticket.grossWeight)],
            ['Truck Number', ticket.truckNo],
            ['Tare Weight (kg)', formatWeight(ticket.tareWeight)],
            ['Truck Driver', ticket.driverName],
            // FIX: Use 'as const' to ensure TypeScript infers the literal type 'bold' for fontStyle, which matches the expected 'FontStyle' type.
            [{ content: 'Net Weight (kg)', styles: { fontStyle: 'bold' as const } }, { content: formatWeight(ticket.netWeight), styles: { fontStyle: 'bold' as const } }],
            ['Source', ticket.origin],
            ['Operator', ticket.operatorName],
            ['Notes', ticket.notes || 'N/A'],
        ];

        autoTable(doc, {
            startY: 40,
            theme: 'grid',
            body: tableBody,
        });

        doc.save(`Purchase_Ticket_${ticket.id}.pdf`);
    };

    const handleExportCsv = () => {
        const headers = Object.keys(ticket).join(',');
        const values = Object.values(ticket).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',');
        const csvContent = `${headers}\n${values}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Purchase_Ticket_${ticket.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEmail = () => {
        const subject = `Purchase Ticket Details: ${ticket.id}`;
        let body = '';
        for (const [key, value] of Object.entries(ticket)) {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            body += `${formattedKey}: ${value}\n`;
        }
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
        window.location.href = mailtoLink;
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Purchase Record Details: #${ticket.id}`}>
            <div id="ticket-to-print" className="printable-content space-y-6">
                <div className="text-center print:text-left">
                    <h2 className="text-2xl font-bold">Purchase Ticket</h2>
                    <p className="text-gray-500">Ticket No: {ticket.id} | Serial No: {ticket.serialNo}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm border-t border-b py-4">
                    <div><strong className="block text-gray-500 dark:text-gray-400">Date</strong> {ticket.date}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Customer</strong> {ticket.customerName}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Truck Number</strong> {ticket.truckNo}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Order No</strong> {ticket.poNo}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Time In</strong> {ticket.timeIn}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Time Out</strong> {ticket.timeOut}</div>
                    <div className="md:col-span-3"><strong className="block text-gray-500 dark:text-gray-400">Materials</strong> {ticket.materialCode}</div>
                    <div className="md:col-span-3"><strong className="block text-gray-500 dark:text-gray-400">Destination</strong> {ticket.destination}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Transporter</strong> {ticket.transporter}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Source</strong> {ticket.origin}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Truck Driver</strong> {ticket.driverName}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Operator</strong> {ticket.operatorName}</div>
                </div>
                 <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Gross Weight</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{formatWeight(ticket.grossWeight)} kg</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tare Weight</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{formatWeight(ticket.tareWeight)} kg</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Net Weight</p>
                        <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatWeight(ticket.netWeight)} kg</p>
                    </div>
                </div>
                {ticket.notes && <div className="pt-4 border-t"><strong className="block text-gray-500 dark:text-gray-400 text-sm">Notes</strong><p className="text-sm mt-1">{ticket.notes}</p></div>}
            </div>
            <div className="flex justify-end pt-4 space-x-2 border-t mt-4 no-print">
                <button onClick={handleEmail} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"><EmailIcon className="w-4 h-4 mr-2" /> Email</button>
                <button onClick={handleExportPdf} className="flex items-center px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm"><PdfIcon className="w-4 h-4 mr-2" /> Export PDF</button>
                <button onClick={handleExportCsv} className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm"><ExcelIcon className="w-4 h-4 mr-2" /> Export Excel</button>
                <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"><PrinterIcon className="w-4 h-4 mr-2" /> Print</button>
            </div>
        </Modal>
    );
};

const PurchaseRecordPage: React.FC = () => {
    const { purchaseTickets, deletePurchaseTicket } = useData();
    const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<PurchaseTicket | null>(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredTickets = useMemo(() => {
        return purchaseTickets.filter(ticket => {
            // Status Filter
            if (statusFilter !== 'All' && ticket.status !== statusFilter) {
                return false;
            }
            // Date Filter
            const ticketDate = new Date(ticket.date);
            if (dateFrom && ticketDate < new Date(dateFrom)) {
                return false;
            }
            // Add one day to dateTo to make the range inclusive
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setDate(endDate.getDate() + 1);
                if (ticketDate >= endDate) {
                    return false;
                }
            }
            // Search Term Filter
            if (!debouncedSearchTerm) return true;
            const term = debouncedSearchTerm.toLowerCase();
            return (
                ticket.id.toLowerCase().includes(term) ||
                ticket.customerName.toLowerCase().includes(term) ||
                ticket.materialCode.toLowerCase().includes(term) ||
                ticket.truckNo.toLowerCase().includes(term) ||
                ticket.poNo.toLowerCase().includes(term)
            );
        });
    }, [purchaseTickets, debouncedSearchTerm, statusFilter, dateFrom, dateTo]);

    const handleAddNew = () => {
        setSelectedTicket(null);
        setAddEditModalOpen(true);
    };

    const handleViewTicket = (ticket: PurchaseTicket) => {
        setSelectedTicket(ticket);
        setViewModalOpen(true);
    };
    
    const handleEditTicket = (ticket: PurchaseTicket) => {
        setSelectedTicket(ticket);
        setAddEditModalOpen(true);
    };

    const handleDeleteTicket = (ticket: PurchaseTicket) => {
        setSelectedTicket(ticket);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (selectedTicket) {
            deletePurchaseTicket(selectedTicket.id);
        }
        setDeleteConfirmOpen(false);
        setSelectedTicket(null);
    };

    const renderActions = (ticket: PurchaseTicket) => (
        <div className="space-x-2">
            <button onClick={() => handleEditTicket(ticket)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 font-medium">Edit</button>
            <button onClick={() => handleDeleteTicket(ticket)} className="text-red-600 hover:text-red-900 dark:text-red-400 font-medium">Delete</button>
        </div>
    );

    const columns: any[] = [
        { header: 'Ticket No', accessor: 'id', sortable: true },
        { header: 'Date', accessor: 'date', sortable: true },
        { header: 'Customer', accessor: 'customerName', sortable: true },
        { header: 'Truck No.', accessor: 'truckNo', sortable: true },
        { header: 'Material Code', accessor: 'materialCode', sortable: true },
        { header: 'Net Weight (kg)', accessor: 'netWeight', sortable: true, render: (item: PurchaseTicket) => typeof item.netWeight === 'number' ? item.netWeight.toLocaleString() : item.netWeight },
        { header: 'Status', accessor: 'status', sortable: true, render: (item: PurchaseTicket) => {
            const color = item.status === 'Received' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{item.status}</span>;
        }},
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                     <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Purchase Records</h2>
                     <nav className="text-sm font-medium text-gray-500" aria-label="Breadcrumb">
                        <ol className="list-none p-0 inline-flex">
                            <li className="flex items-center">
                                <Link to="/purchases" className="text-indigo-600 dark:text-indigo-400 hover:underline">Purchases</Link>
                                <svg className="fill-current w-3 h-3 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7 1L5.6 2.5L13.2 10l-7.6 7.5L7 19l9-9z"/></svg>
                            </li>
                            <li className="text-gray-500">
                                Purchase Records
                            </li>
                        </ol>
                    </nav>
                </div>
                <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Record
                </button>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-center no-print">
                <div className="md:col-span-2">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            id="purchase-record-search"
                            type="text"
                            placeholder="Search by Ticket No, Customer, Truck No, etc..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="purchase_record_status" className="sr-only">Status</label>
                    <select id="purchase_record_status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full">
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full"
                        aria-label="Date from"
                    />
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                    <input 
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-full"
                        aria-label="Date to"
                    />
                </div>
            </div>

            <DataTable 
                columns={columns} 
                data={filteredTickets} 
                onViewDetails={handleViewTicket} 
                renderActions={renderActions}
            />
            <AddEditPurchaseTicketModal isOpen={isAddEditModalOpen} onClose={() => setAddEditModalOpen(false)} ticket={selectedTicket} />
            <ViewPurchaseTicketModal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} ticket={selectedTicket} />
            <Modal isOpen={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion">
                <div>
                    <p>Are you sure you want to delete purchase record <strong>#{selectedTicket?.id}</strong>? This action cannot be undone.</p>
                    <div className="flex justify-end pt-4 space-x-2 mt-4">
                        <button onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseRecordPage;