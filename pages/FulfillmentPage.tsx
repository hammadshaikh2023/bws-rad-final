import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { SalesOrder, GatePass, Reminder, PackingSlip, ShippingLabel } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PrinterIcon, DownloadIcon, ClockIcon } from '../components/IconComponents';
import { BWS_LOGO_BASE64 } from '../assets/logoBase64';

// Company logo for branded documents
const BWS_LOGO = BWS_LOGO_BASE64;

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

const PackingSlipModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    order: SalesOrder | null;
}> = ({ isOpen, onClose, order }) => {
    if (!order) return null;
    
    const handleSavePdf = () => {
        if (!order) return;
        const doc = new jsPDF();
        
        // Logo and Title
        doc.addImage(BWS_LOGO, 'PNG', 15, 10, 40, 12);
        doc.setFontSize(20);
        doc.text("Packing Slip", 200, 20, { align: 'right' });
        doc.setFontSize(12);
        doc.text(`Order ID: ${order.id}`, 200, 28, { align: 'right' });

        // Addresses
        doc.setFontSize(10);
        doc.text("FROM:", 15, 40);
        doc.setFontSize(12);
        doc.text("BWS Inc.", 15, 46);
        doc.text("123 Industrial Ave, Gravelton", 15, 52);

        doc.setFontSize(10);
        doc.text("SHIP TO:", 110, 40);
        doc.setFontSize(12);
        doc.text(order.customer.name, 110, 46);
        doc.text(order.customer.shippingAddress, 110, 52);

        // Items table
        autoTable(doc, {
            startY: 65,
            head: [['Product Name', 'Quantity', 'Unit']],
            body: order.items.map(item => [item.productName, item.quantity, 'Units']),
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] } // indigo-600
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFontSize(10);
        doc.text("Packed by: _________________________", 20, finalY + 20);
        doc.text("Checked by: _________________________", 110, finalY + 20);

        doc.save(`Packing_Slip_${order.id}.pdf`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Packing Slip for Order #${order.id}`}>
            <div className="printable-content space-y-6 text-gray-800 dark:text-gray-200">
                <header className="text-center">
                    <h2 className="text-2xl font-bold">Packing Slip</h2>
                    <p>Order ID: {order.id}</p>
                </header>
                <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                    <div>
                        <h3 className="font-semibold">BWS Inc.</h3>
                        <p>123 Industrial Ave, Gravelton</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Ship To:</h3>
                        <p>{order.customer.name}</p>
                        <p>{order.customer.shippingAddress}</p>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Order Items</h3>
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Product Name</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Quantity</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {order.items.map(item => (
                                <tr key={item.productId}>
                                    <td className="px-4 py-2">{item.productName}</td>
                                    <td className="px-4 py-2">{item.quantity}</td>
                                    <td className="px-4 py-2">Units</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <footer className="pt-8 mt-8 border-t">
                    <div className="flex justify-between">
                        <div>
                            <p className="mt-4">Packed by: _________________________</p>
                        </div>
                        <div>
                            <p className="mt-4">Checked by: ________________________</p>
                        </div>
                    </div>
                </footer>
                <div className="flex justify-end pt-4 space-x-2 no-print">
                    <button onClick={handleSavePdf} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        <DownloadIcon className="w-5 h-5 mr-2" /> Save as PDF
                    </button>
                    <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <PrinterIcon className="w-5 h-5 mr-2" /> Print
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const ShippingLabelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    order: SalesOrder | null;
}> = ({ isOpen, onClose, order }) => {
    if (!order) return null;

    const handleSavePdf = () => {
        if (!order) return null;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [100, 150] // A standard shipping label size (approx 4x6 inches)
        });

        // Border
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(5, 5, 90, 140);
        doc.setLineDashPattern([], 0);

        // From Address
        doc.setFontSize(8);
        doc.text("FROM:", 10, 15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("BWS Inc.", 10, 22);
        doc.setFont('helvetica', 'normal');
        doc.text("123 Industrial Ave", 10, 28);
        doc.text("Gravelton, ST 12345", 10, 34);

        // Separator line
        doc.line(10, 40, 90, 40);

        // To Address
        doc.setFontSize(8);
        doc.text("TO:", 10, 48);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(order.customer.name, 10, 55);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(order.customer.shippingAddress, 10, 61);

        // Barcode area
        doc.line(10, 90, 90, 90);
        doc.setFont("monospace", "normal");
        doc.setFontSize(22);
        doc.text("||| | ||| |||| || |||| |||| |||", 50, 110, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(order.id, 50, 120, { align: 'center' });

        doc.save(`Shipping_Label_${order.id}.pdf`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Shipping Label for Order #${order.id}`}>
            <div className="printable-content border-4 border-dashed p-4" style={{ minHeight: '400px', width: '100%'}}>
                <div className="grid grid-cols-2 gap-4">
                    <div className="border-r pr-4">
                        <h4 className="text-sm font-light">FROM:</h4>
                        <p className="font-bold text-lg">BWS Inc.</p>
                        <p>123 Industrial Ave</p>
                        <p>Gravelton, ST 12345</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-light">TO:</h4>
                        <p className="font-bold text-lg">{order.customer.name}</p>
                        <p>{order.customer.shippingAddress}</p>
                    </div>
                </div>
                <div className="text-center mt-8 pt-8 border-t-2 border-dashed">
                    <p className="text-lg font-mono tracking-widest">||| | ||| |||| || |||| |||| |||</p>
                    <p className="font-bold text-2xl">{order.id}</p>
                </div>
                 <div className="flex justify-end pt-4 space-x-2 no-print">
                    <button onClick={handleSavePdf} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        <DownloadIcon className="w-5 h-5 mr-2" /> Save as PDF
                    </button>
                    <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <PrinterIcon className="w-5 h-5 mr-2" /> Print
                    </button>
                </div>
            </div>
        </Modal>
    );
}

const GatePassModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    order: SalesOrder | null;
    mode: 'create' | 'view';
}> = ({ isOpen, onClose, order, mode }) => {
    const { gatePasses, addGatePass, updateGatePassStatus } = useData();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Omit<GatePass, 'gatePassId' | 'issueDate' | 'status' | 'orderId'>>({
        driverName: '', driverContact: '', driverIdNumber: '', driverLicenseNumber: '', vehicleNumber: ''
    });

    if (!order) return null;
    const existingGatePass = gatePasses.find(gp => gp.orderId === order.id);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: The `addGatePass` function requires the `orderId`, which comes from the `order` prop.
        // This combines the `orderId` with the form data to create a complete object for the function call.
        addGatePass({ orderId: order.id, ...formData });
        onClose();
    };

    const handleApproveExit = () => {
        if (existingGatePass && currentUser) {
            updateGatePassStatus(existingGatePass.gatePassId, currentUser.name);
            onClose();
        }
    };
    
     const handleEmail = () => {
        if (!existingGatePass) return;
        const subject = `Gate Pass for Order ${order.id}`;
        const body = `
GATE PASS - ${existingGatePass.gatePassId}
-----------------------------------
Order ID: ${order.id}
Customer: ${order.customer.name}
Issue Date: ${new Date(existingGatePass.issueDate).toLocaleString()}
Status: ${existingGatePass.status}
-----------------------------------
DRIVER DETAILS
Name: ${existingGatePass.driverName}
Contact: ${existingGatePass.driverContact}
ID Number: ${existingGatePass.driverIdNumber}
License No: ${existingGatePass.driverLicenseNumber}
-----------------------------------
VEHICLE DETAILS
Vehicle No: ${existingGatePass.vehicleNumber}
-----------------------------------
ITEMS
${order.items.map(item => `- ${item.quantity}x ${item.productName}`).join('\n')}
-----------------------------------
This pass authorizes the above vehicle and driver to exit the premises with the specified goods.
`;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
        window.location.href = mailtoLink;
    };
    
    const handleSavePdf = () => {
        if (!existingGatePass || !order) return;
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("Gate Pass", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gate Pass ID: ${existingGatePass.gatePassId}`, 20, 35);
        doc.text(`Order ID: ${order.id}`, 20, 42);
        doc.text(`Customer: ${order.customer.name}`, 20, 49);
        doc.text(`Date Issued: ${new Date(existingGatePass.issueDate).toLocaleString()}`, 20, 56);
        doc.text(`Status: ${existingGatePass.status}`, 20, 63);


        // Driver & Vehicle Info
        doc.line(20, 70, 190, 70); // separator
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Driver & Vehicle Information", 20, 80);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Driver: ${existingGatePass.driverName} (${existingGatePass.driverContact})`, 25, 90);
        doc.text(`License No: ${existingGatePass.driverLicenseNumber}`, 25, 97);
        doc.text(`Vehicle No: ${existingGatePass.vehicleNumber}`, 25, 104);

        // Items
        doc.line(20, 115, 190, 115); // separator
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Items for Dispatch", 20, 125);
        
        const itemBody = order.items.map(item => [`- ${item.quantity}x ${item.productName}`]);
        autoTable(doc, {
            startY: 130,
            body: itemBody,
            theme: 'plain',
            styles: { cellPadding: 1, fontSize: 12 },
        });
        
        // Authorization text
        let finalY = (doc as any).lastAutoTable.finalY || 150;

        if (existingGatePass.status === 'Exited') {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Vehicle Cleared for Exit", 20, finalY + 15);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Cleared by: ${existingGatePass.clearedBy}`, 25, finalY + 22);
            doc.text(`Exit Time: ${new Date(existingGatePass.exitTimestamp!).toLocaleString()}`, 25, finalY + 28);
            finalY += 20;
        }

        doc.setFontSize(10);
        doc.text("This pass authorizes the above vehicle and driver to exit the premises with the specified goods.", 20, finalY + 15);
        
        doc.save(`Gate_Pass_${existingGatePass.gatePassId}.pdf`);
    };

    if (mode === 'create') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Create Gate Pass for Order #${order.id}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Driver's Name</label>
                            <input type="text" name="driverName" onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Driver's Contact</label>
                            <input type="tel" name="driverContact" onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Driver's ID Number</label>
                            <input type="text" name="driverIdNumber" onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Driver's License Number</label>
                            <input type="text" name="driverLicenseNumber" onChange={handleChange} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Vehicle Number</label>
                            <input type="text" name="vehicleNumber" onChange={handleChange} required />
                        </div>
                     </div>
                     <div className="flex justify-end pt-4 space-x-2 border-t mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Gate Pass</button>
                    </div>
                </form>
            </Modal>
        )
    }

    if (mode === 'view' && existingGatePass) {
         return (
             <Modal isOpen={isOpen} onClose={onClose} title={`Gate Pass #${existingGatePass.gatePassId}`}>
                <div className="printable-content space-y-4 text-gray-800 dark:text-gray-200">
                    <h3 className="text-xl font-bold">Gate Pass: {existingGatePass.gatePassId}</h3>
                    <p><strong>Order ID:</strong> {order.id}</p>
                    <p><strong>Customer:</strong> {order.customer.name}</p>
                    <p><strong>Date Issued:</strong> {new Date(existingGatePass.issueDate).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span className={`font-bold ${existingGatePass.status === 'Exited' ? 'text-green-600' : 'text-yellow-600'}`}>{existingGatePass.status}</span></p>
                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold">Driver & Vehicle Information</h4>
                        <p><strong>Driver:</strong> {existingGatePass.driverName} ({existingGatePass.driverContact})</p>
                        <p><strong>License No:</strong> {existingGatePass.driverLicenseNumber}</p>
                        <p><strong>Vehicle No:</strong> {existingGatePass.vehicleNumber}</p>
                    </div>
                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold">Items for Dispatch</h4>
                         <ul className="list-disc pl-5">
                            {order.items.map(item => <li key={item.productId}>{item.quantity}x {item.productName}</li>)}
                        </ul>
                    </div>
                    {existingGatePass.status === 'Exited' && (
                        <div className="border-t pt-4 mt-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <h4 className="font-semibold text-green-800 dark:text-green-300">Vehicle Cleared for Exit</h4>
                            <p><strong>Cleared by:</strong> {existingGatePass.clearedBy}</p>
                            <p><strong>Exit Time:</strong> {new Date(existingGatePass.exitTimestamp!).toLocaleString()}</p>
                        </div>
                    )}
                </div>
                 <div className="flex justify-end pt-4 space-x-2 border-t mt-4 no-print">
                    <button onClick={handleEmail} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Email</button>
                    <button onClick={handleSavePdf} className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
                        <DownloadIcon className="w-5 h-5 mr-2" /> Save as PDF
                    </button>
                    <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <PrinterIcon className="w-5 h-5 mr-2" /> Print
                    </button>
                    {currentUser?.roles.includes('Security Guard') && existingGatePass.status === 'Issued' && (
                        <button onClick={handleApproveExit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve Vehicle Exit</button>
                    )}
                </div>
             </Modal>
         )
    }
    
    return null;
}

const SetReminderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    order: SalesOrder | null;
}> = ({ isOpen, onClose, order }) => {
    const { addReminder } = useData();
    const [task, setTask] = useState('Check inventory levels');
    const [customTask, setCustomTask] = useState('');
    const [reminderDateTime, setReminderDateTime] = useState('');

    useEffect(() => {
        if (order) {
            // Set a default reminder time, e.g., next day at 9 AM
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            setReminderDateTime(tomorrow.toISOString().slice(0, 16));
            setTask('Check inventory levels');
            setCustomTask('');
        }
    }, [order, isOpen]);

    if (!order) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTask = task === 'Other' ? customTask : task;
        if (!finalTask || !reminderDateTime) {
            alert('Please fill out all fields.');
            return;
        }
        addReminder({
            orderId: order.id,
            task: finalTask,
            reminderDateTime,
        });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Set Reminder for Order #${order.id}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task</label>
                    <select value={task} onChange={e => setTask(e.target.value)} className="mt-1">
                        <option>Check inventory levels</option>
                        <option>Prepare shipping label</option>
                        <option>Confirm with logistics</option>
                        <option value="Other">Other (Specify)</option>
                    </select>
                </div>
                {task === 'Other' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Task</label>
                        <input type="text" value={customTask} onChange={e => setCustomTask(e.target.value)} required className="mt-1" />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reminder Date & Time</label>
                    <input
                        type="datetime-local"
                        value={reminderDateTime}
                        onChange={e => setReminderDateTime(e.target.value)}
                        required
                        className="mt-1"
                    />
                </div>
                <div className="flex justify-end pt-4 space-x-2 border-t mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Set Reminder</button>
                </div>
            </form>
        </Modal>
    );
};


const FulfillmentPage: React.FC = () => {
    const { salesOrders, gatePasses, packingSlips, shippingLabels, addPackingSlip, addShippingLabel, reminders } = useData();
    const { currentUser } = useAuth();
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    const [isPackingSlipOpen, setPackingSlipOpen] = useState(false);
    const [isShippingLabelOpen, setShippingLabelOpen] = useState(false);
    const [isGatePassModalOpen, setGatePassModalOpen] = useState(false);
    const [gatePassMode, setGatePassMode] = useState<'create' | 'view'>('create');
    const [isReminderModalOpen, setReminderModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const isSecurityGuard = currentUser?.roles.includes('Security Guard');

    const ordersToDisplay = useMemo(() => {
        return salesOrders
            .filter(o => {
                const term = debouncedSearchTerm.toLowerCase();
                const matchesSearch = o.id.toLowerCase().includes(term) || o.customer.name.toLowerCase().includes(term);

                if (!matchesSearch) return false;

                if (isSecurityGuard) {
                    // Guards see orders with an issued or exited gate pass for review.
                    return gatePasses.some(gp => gp.orderId === o.id);
                }
                // Others see all pending orders for fulfillment processing.
                return o.status === 'Pending';
            })
             .sort((a, b) => {
                // For guards, sort by gate pass issue date (newest first).
                if(isSecurityGuard) {
                    const gatePassA = gatePasses.find(gp => gp.orderId === a.id);
                    const gatePassB = gatePasses.find(gp => gp.orderId === b.id);
                    if (gatePassA && gatePassB) {
                        return new Date(gatePassB.issueDate).getTime() - new Date(gatePassA.issueDate).getTime();
                    }
                }
                // Default sort by order date for others.
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [salesOrders, gatePasses, debouncedSearchTerm, isSecurityGuard]);


    const columns = [
        {
            header: 'Order ID',
            accessor: 'id' as keyof SalesOrder,
            sortable: true,
            render: (order: SalesOrder) => {
                const pendingReminder = reminders.find(r => r.orderId === order.id && r.status === 'Pending');
                return (
                    <div className="flex items-center space-x-2">
                        <span>{order.id}</span>
                        {pendingReminder && (
                            <div className="relative group">
                                <ClockIcon className="w-4 h-4 text-indigo-500" />
                                <div className="absolute bottom-full mb-2 w-48 p-2 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <p className="font-bold">{pendingReminder.task}</p>
                                    <p>{new Date(pendingReminder.reminderDateTime).toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        },
        { header: 'Customer', accessor: 'customer' as keyof SalesOrder, sortable: true, render: (item: SalesOrder) => item.customer.name },
        { header: 'Date', accessor: 'date' as keyof SalesOrder, sortable: true },
        ...(!isSecurityGuard ? [{ 
            header: 'Items to Fulfill', 
            accessor: 'items' as keyof SalesOrder,
            render: (item: SalesOrder) => (
                <ul className="text-xs list-disc pl-4">
                    {item.items.map(product => (
                        <li key={product.productId}>
                            <span className="font-semibold">{product.quantity}x</span> {product.productName}
                        </li>
                    ))}
                </ul>
            )
        }] : []),
        { 
            header: 'Documents', 
            accessor: 'id' as keyof SalesOrder, // Use a key that's available on the item
            render: (order: SalesOrder) => {
                const hasPackingSlip = packingSlips.some(p => p.orderId === order.id);
                const hasShippingLabel = shippingLabels.some(l => l.orderId === order.id);
                const hasGatePass = gatePasses.some(g => g.orderId === order.id);

                const statusClass = (hasDoc: boolean) => hasDoc 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';

                return (
                    <div className="flex flex-col space-y-1 text-xs font-medium">
                        <span className={`px-2 py-0.5 rounded-full ${statusClass(hasPackingSlip)}`}>Packing Slip</span>
                        <span className={`px-2 py-0.5 rounded-full ${statusClass(hasShippingLabel)}`}>Shipping Label</span>
                        <span className={`px-2 py-0.5 rounded-full ${statusClass(hasGatePass)}`}>Gate Pass</span>
                    </div>
                );
            }
        },
        {
            header: 'Gate Pass Status',
            accessor: 'id' as keyof SalesOrder,
            render: (order: SalesOrder) => {
                const gatePass = gatePasses.find(gp => gp.orderId === order.id);
                if (!gatePass) return <span className="text-sm text-gray-500">N/A</span>;
                
                const statusMap: Record<GatePass['status'], string> = {
                    'Issued': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                    'Exited': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                };
                return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusMap[gatePass.status]}`}>{gatePass.status}</span>;
            }
        }
    ];
    
    const renderActions = (order: SalesOrder) => {
        const hasGatePass = gatePasses.some(gp => gp.orderId === order.id);
        const hasPackingSlip = packingSlips.some(p => p.orderId === order.id);
        const hasShippingLabel = shippingLabels.some(l => l.orderId === order.id);

        if (isSecurityGuard) {
            return (
                <button
                    onClick={() => {
                        setSelectedOrder(order);
                        setGatePassMode('view');
                        setGatePassModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md dark:bg-indigo-900/50 dark:text-indigo-300 w-full text-left whitespace-nowrap font-semibold"
                    disabled={!hasGatePass}
                >
                    View / Process Pass
                </button>
            )
        }

        const handlePackingSlipClick = () => {
            if (!hasPackingSlip) {
                addPackingSlip({ orderId: order.id });
            }
            setSelectedOrder(order);
            setPackingSlipOpen(true);
        };

        const handleShippingLabelClick = () => {
            if (!hasShippingLabel) {
                addShippingLabel({ orderId: order.id });
            }
            setSelectedOrder(order);
            setShippingLabelOpen(true);
        };
        
        return (
            <div className="flex flex-col sm:flex-row gap-2 items-start">
                <button
                    onClick={() => {
                        setSelectedOrder(order);
                        setReminderModalOpen(true);
                    }}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md dark:bg-yellow-900/50 dark:text-yellow-300 w-full text-left whitespace-nowrap"
                >
                    Set Reminder
                </button>
                <button onClick={handlePackingSlipClick} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md dark:bg-blue-900/50 dark:text-blue-300 w-full text-left whitespace-nowrap">
                    {hasPackingSlip ? 'View Slip' : 'Generate Slip'}
                </button>
                <button onClick={handleShippingLabelClick} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md dark:bg-green-900/50 dark:text-green-300 w-full text-left whitespace-nowrap">
                    {hasShippingLabel ? 'View Label' : 'Generate Label'}
                </button>
                <button 
                    onClick={() => {
                        setSelectedOrder(order);
                        setGatePassMode(hasGatePass ? 'view' : 'create');
                        setGatePassModalOpen(true);
                    }}
                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md dark:bg-indigo-900/50 dark:text-indigo-300 w-full text-left whitespace-nowrap"
                >
                    {hasGatePass ? 'View Pass' : 'Create Pass'}
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                {isSecurityGuard ? 'Gate Pass Approvals' : 'Order Fulfillment'}
            </h2>
             <p className="text-gray-600 dark:text-gray-400 -mt-4">
                {isSecurityGuard 
                    ? 'Review and approve vehicle exits for orders with issued gate passes.'
                    : 'Manage pending orders, generate documents, and set reminders for fulfillment.'}
            </p>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg no-print">
                <input
                    type="text"
                    placeholder="Search by Order ID or Customer..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 shadow-sm rounded-md"
                />
            </div>
            
            <DataTable columns={columns} data={ordersToDisplay} renderActions={renderActions} />

            <PackingSlipModal isOpen={isPackingSlipOpen} onClose={() => setPackingSlipOpen(false)} order={selectedOrder} />
            <ShippingLabelModal isOpen={isShippingLabelOpen} onClose={() => setShippingLabelOpen(false)} order={selectedOrder} />
            <GatePassModal isOpen={isGatePassModalOpen} onClose={() => setGatePassModalOpen(false)} order={selectedOrder} mode={gatePassMode} />
            <SetReminderModal isOpen={isReminderModalOpen} onClose={() => setReminderModalOpen(false)} order={selectedOrder} />
        </div>
    );
};

export default FulfillmentPage;