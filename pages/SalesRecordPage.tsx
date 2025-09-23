






import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SalesTicket } from '../types';
import { PlusIcon, PrinterIcon, PdfIcon, ExcelIcon, EmailIcon } from '../components/IconComponents';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BWS_LOGO_BASE64 } from '../assets/logoBase64';

const CreateSalesTicketModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    ticket: SalesTicket | null;
}> = ({ isOpen, onClose, ticket }) => {
    const { addSalesTicket, updateSalesTicket, products, salesTickets } = useData();
    const isEditMode = !!ticket;
    
    const initialFormState: Partial<SalesTicket> = {
        id: '',
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        truckNo: '',
        materialDestination: 'WET MIX, MACADAM',
        destination: '',
        transporter: '',
        materialCode: 'WET MIX',
        timeIn: '',
        sourceId: 'N/A',
        timeOut: '',
        temperature: undefined,
        tareWeight: 'N/A',
        lpoNo: '',
        grossWeight: 'N/A',
        driverName: '',
        operatorName: 'N/A',
    };

    const [formData, setFormData] = useState<Partial<SalesTicket>>(initialFormState);
    const [netWeight, setNetWeight] = useState<number | string>('N/A');
    const [ticketNoError, setTicketNoError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData(ticket);
                const gross = Number(ticket.grossWeight) || 0;
                const tare = Number(ticket.tareWeight) || 0;
                setNetWeight(gross > tare ? gross - tare : 0);
            } else {
                setFormData(initialFormState);
                setNetWeight('N/A');
            }
            setTicketNoError(null);
        }
    }, [isOpen, ticket, isEditMode]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'id' && !isEditMode) {
            if (salesTickets.some(ticket => ticket.id === value)) {
                setTicketNoError('This Ticket No already exists.');
            } else {
                setTicketNoError(null);
            }
        }
        
        if (name === 'tareWeight' || name === 'grossWeight') {
             setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            const isNumberField = ['temperature'].includes(name);
            setFormData(prev => ({
                ...prev,
                [name]: isNumberField ? (value === '' ? undefined : Number(value)) : value
            }));
        }
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
        
        const ticketData: SalesTicket = {
            id: formData.id!,
            date: formData.date!,
            customerName: formData.customerName!,
            truckNo: formData.truckNo!,
            materialDestination: formData.materialDestination!,
            transporter: formData.transporter!,
            materialCode: formData.materialCode!,
            timeIn: formData.timeIn!,
            sourceId: formData.sourceId,
            timeOut: formData.timeOut!,
            temperature: formData.temperature,
            tareWeight: formData.tareWeight === 0 ? 0 : (formData.tareWeight || 'N/A'),
            lpoNo: formData.lpoNo!,
            grossWeight: formData.grossWeight === 0 ? 0 : (formData.grossWeight || 'N/A'),
            driverName: formData.driverName!,
            netWeight,
            destination: formData.destination!,
            operatorName: formData.operatorName!,
        };

        if (isEditMode) {
            updateSalesTicket(ticketData);
        } else {
            addSalesTicket(ticketData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Sales Record" : "Create New Sales Record"}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Ticket No */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ticket No</label>
                        <input type="text" name="id" value={formData.id || ''} onChange={handleChange} required readOnly={isEditMode} className={isEditMode ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""} />
                        {ticketNoError && <p className="text-red-500 text-xs mt-1">{ticketNoError}</p>}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </div>

                    {/* Customer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                        <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required />
                    </div>

                    {/* Truck No */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Truck No.</label>
                        <input type="text" name="truckNo" value={formData.truckNo} onChange={handleChange} required />
                    </div>

                    {/* Material Destination */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material Destination</label>
                        <input type="text" name="materialDestination" value={formData.materialDestination} onChange={handleChange} required />
                    </div>

                    {/* Transporter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transporter</label>
                        <input type="text" name="transporter" value={formData.transporter} onChange={handleChange} />
                    </div>

                    {/* Material Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material Code</label>
                        <select name="materialCode" value={formData.materialCode} onChange={handleChange} required>
                            <option value="">Select Material</option>
                            {products.map(p => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
                        </select>
                    </div>

                    {/* Time In */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time In</label>
                        <input type="time" name="timeIn" value={formData.timeIn} onChange={handleChange} />
                    </div>

                    {/* Source ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source ID</label>
                        <input type="text" name="sourceId" value={formData.sourceId || ''} onChange={handleChange} />
                    </div>

                    {/* Time Out */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Out</label>
                        <input type="time" name="timeOut" value={formData.timeOut} onChange={handleChange} />
                    </div>

                    {/* Temp */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Temp (°C)</label>
                        <input type="number" name="temperature" placeholder="e.g., 150" value={formData.temperature ?? ''} onChange={handleChange} />
                    </div>

                    {/* Tare Weight */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tare Weight (kg)</label>
                        <input type="text" name="tareWeight" value={formData.tareWeight ?? ''} onChange={handleChange} required />
                    </div>

                    {/* L.P.O No */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">L.P.O</label>
                        <input type="text" name="lpoNo" value={formData.lpoNo} onChange={handleChange} />
                    </div>

                    {/* Gross Weight */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gross Weight (kg)</label>
                        <input type="text" name="grossWeight" value={formData.grossWeight ?? ''} onChange={handleChange} required />
                    </div>
                    
                    {/* Driver Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Name</label>
                        <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} />
                    </div>

                    {/* Net Weight */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Net Weight (kg)</label>
                        <input type="text" value={typeof netWeight === 'number' ? netWeight.toLocaleString() : netWeight} readOnly className="bg-gray-200 dark:bg-gray-600" />
                    </div>

                    {/* Destination (second) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destination</label>
                        <input type="text" name="destination" value={formData.destination} onChange={handleChange} required />
                    </div>
                    
                    {/* Operator Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operator Name</label>
                        <input type="text" name="operatorName" value={formData.operatorName} onChange={handleChange} />
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

const ViewSalesTicketModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    ticket: SalesTicket | null;
}> = ({ isOpen, onClose, ticket }) => {
    if (!ticket) return null;

    const formatWeight = (weight: number | string) => {
        if (typeof weight === 'number') {
            return weight.toLocaleString();
        }
        return weight;
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        
        doc.addImage(BWS_LOGO_BASE64, 'PNG', 15, 10, 40, 12);
        doc.setFontSize(20);
        doc.text("Sales Ticket", 200, 20, { align: 'right' });
        doc.setFontSize(12);
        doc.text(`Ticket No: ${ticket.id}`, 200, 28, { align: 'right' });

        const tableBody = [
            ['Date', ticket.date],
            ['Customer', ticket.customerName],
            ['Truck No.', ticket.truckNo],
            ['Material Code', ticket.materialCode],
            ['LPO No.', ticket.lpoNo],
            ['Transporter', ticket.transporter],
            ['Driver Name', ticket.driverName],
            ['Material Destination', ticket.materialDestination],
            ['Final Destination', ticket.destination],
            ['Time In', ticket.timeIn],
            ['Time Out', ticket.timeOut],
            ['Gross Weight (kg)', formatWeight(ticket.grossWeight)],
            ['Tare Weight (kg)', formatWeight(ticket.tareWeight)],
            // FIX: Use 'as const' to ensure TypeScript infers the literal type 'bold' for fontStyle, which matches the expected 'FontStyle' type.
            [{ content: 'Net Weight (kg)', styles: { fontStyle: 'bold' as const } }, { content: formatWeight(ticket.netWeight), styles: { fontStyle: 'bold' as const } }],
            ['Operator', ticket.operatorName],
        ];

        if (ticket.temperature) {
             tableBody.splice(11, 0, ['Temperature (°C)', String(ticket.temperature)]);
        }

        autoTable(doc, {
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            body: tableBody,
        });

        doc.save(`Sales_Ticket_${ticket.id}.pdf`);
    };

    const handleExportCsv = () => {
        const headers = Object.keys(ticket).join(',');
        const values = Object.values(ticket).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',');
        const csvContent = `${headers}\n${values}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Sales_Ticket_${ticket.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEmail = () => {
        const subject = `Sales Ticket Details: ${ticket.id}`;
        const body = `
Sales Ticket: ${ticket.id}
Date: ${ticket.date}
Customer: ${ticket.customerName}
Truck No: ${ticket.truckNo}
-----------------------------------
DETAILS
-----------------------------------
Material Destination: ${ticket.materialDestination}
Final Destination: ${ticket.destination}
Material Code: ${ticket.materialCode}
Time In: ${ticket.timeIn}
Time Out: ${ticket.timeOut}
Gross Weight: ${formatWeight(ticket.grossWeight)} kg
Tare Weight: ${formatWeight(ticket.tareWeight)} kg
Net Weight: ${formatWeight(ticket.netWeight)} kg
Driver: ${ticket.driverName || 'N/A'}
Operator: ${ticket.operatorName}
        `;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
        window.location.href = mailtoLink;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Sales Record Details: #${ticket.id}`}>
            <div id="ticket-to-print" className="printable-content space-y-6">
                <div className="text-center print:text-left">
                    <h2 className="text-2xl font-bold">Sales Ticket</h2>
                    <p className="text-gray-500">Ticket No: {ticket.id}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm border-t border-b py-4">
                    <div><strong className="block text-gray-500 dark:text-gray-400">Date</strong> {ticket.date}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Customer</strong> {ticket.customerName}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Truck No.</strong> {ticket.truckNo}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Material Code</strong> {ticket.materialCode}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Time In</strong> {ticket.timeIn}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Time Out</strong> {ticket.timeOut}</div>
                    <div className="md:col-span-3"><strong className="block text-gray-500 dark:text-gray-400">Material Destination</strong> {ticket.materialDestination}</div>
                    <div className="md:col-span-3"><strong className="block text-gray-500 dark:text-gray-400">Final Destination</strong> {ticket.destination}</div>
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
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                    <div><strong className="block text-gray-500 dark:text-gray-400">Driver</strong> {ticket.driverName || 'N/A'}</div>
                    <div><strong className="block text-gray-500 dark:text-gray-400">Operator</strong> {ticket.operatorName}</div>
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2 border-t mt-4 no-print">
                <button onClick={handleEmail} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                    <EmailIcon className="w-4 h-4 mr-2" /> Email
                </button>
                <button onClick={handleExportPdf} className="flex items-center px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm">
                    <PdfIcon className="w-4 h-4 mr-2" /> Export PDF
                </button>
                <button onClick={handleExportCsv} className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm">
                    <ExcelIcon className="w-4 h-4 mr-2" /> Export Excel
                </button>
                <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                    <PrinterIcon className="w-4 h-4 mr-2" /> Print
                </button>
            </div>
        </Modal>
    );
};

const SalesRecordPage: React.FC = () => {
    const { salesTickets, deleteSalesTicket } = useData();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SalesTicket | null>(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const handleAddNew = () => {
        setSelectedTicket(null);
        setCreateModalOpen(true);
    };

    const handleViewTicket = (ticket: SalesTicket) => {
        setSelectedTicket(ticket);
        setViewModalOpen(true);
    };
    
    const handleEditTicket = (ticket: SalesTicket) => {
        setSelectedTicket(ticket);
        setCreateModalOpen(true); // Re-use the create/edit modal
    };

    const handleDeleteTicket = (ticket: SalesTicket) => {
        setSelectedTicket(ticket);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (selectedTicket) {
            deleteSalesTicket(selectedTicket.id);
        }
        setDeleteConfirmOpen(false);
        setSelectedTicket(null);
    };

    const renderActions = (ticket: SalesTicket) => (
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
        { header: 'Net Weight (kg)', accessor: 'netWeight', sortable: true, render: (item: SalesTicket) => typeof item.netWeight === 'number' ? item.netWeight.toLocaleString() : item.netWeight },
        { header: 'Destination', accessor: 'destination', sortable: true },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                     <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Sales Records</h2>
                     <nav className="text-sm font-medium text-gray-500" aria-label="Breadcrumb">
                        <ol className="list-none p-0 inline-flex">
                            <li className="flex items-center">
                                <Link to="/sales" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sales</Link>
                                <svg className="fill-current w-3 h-3 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7 1L5.6 2.5L13.2 10l-7.6 7.5L7 19l9-9z"/></svg>
                            </li>
                            <li className="text-gray-500">
                                Sales Records
                            </li>
                        </ol>
                    </nav>
                </div>
                <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Record
                </button>
            </div>

            <DataTable 
                columns={columns} 
                data={salesTickets} 
                onViewDetails={handleViewTicket}
                renderActions={renderActions}
            />
            <CreateSalesTicketModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} ticket={selectedTicket} />
            <ViewSalesTicketModal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} ticket={selectedTicket} />

            <Modal isOpen={isDeleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion">
                <div>
                    <p>Are you sure you want to delete sales record <strong>#{selectedTicket?.id}</strong>? This action cannot be undone.</p>
                    <div className="flex justify-end pt-4 space-x-2 mt-4">
                        <button onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SalesRecordPage;