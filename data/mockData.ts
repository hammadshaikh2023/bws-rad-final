import { Product, SalesOrder, PurchaseOrder, Warehouse, User, AuditLog, Supplier, RawMaterial, SalesTicket, PurchaseTicket } from '../types';

export const mockSuppliers: Supplier[] = [
    { id: 'SUP-001', name: 'Ak Wissam Stone', contactPerson: 'John Doe', email: 'john@wissam.com', address: '123 Wissam Ave, Gravelton' },
    { id: 'SUP-002', name: 'Central Quarry', contactPerson: 'Jane Smith', email: 'jane@centralquarry.com', address: '456 Central Rd, Rockburg' },
    { id: 'SUP-003', name: 'Raj Stones', contactPerson: 'Raj Patel', email: 'raj@rajstones.com', address: '789 Raj St, Stoneton' },
    { id: 'SUP-004', name: 'Al Jaber Crushers', contactPerson: 'Mohammed Ali', email: 'mohammed@aljaber.com', address: '101 Jaber Blvd, Crusher City' },
    { id: 'SUP-005', name: 'BCA Crushers', contactPerson: 'Peter Jones', email: 'peter@bcacrushers.com', address: '212 BCA Lane, Aggregate Town' },
];

export const mockRawMaterials: RawMaterial[] = [
    // Mix Design Materials
    { id: 'RM-001', name: '0-5 mm (3/6)', category: 'Aggregates', stock: 24, unitOfMeasure: 'Percent', supplierId: 'SUP-002', dateAdded: '2023-01-01', description: 'Component for standard mix design.' },
    { id: 'RM-002', name: '5-10 mm (3/8)', category: 'Aggregates', stock: 24, unitOfMeasure: 'Percent', supplierId: 'SUP-002', dateAdded: '2023-01-01', description: 'Component for standard mix design.' },
    { id: 'RM-003', name: '10-20 mm (3/11)', category: 'Aggregates', stock: 24, unitOfMeasure: 'Percent', supplierId: 'SUP-001', dateAdded: '2023-01-01', description: 'Component for standard mix design.' },
    { id: 'RM-004', name: '20-40 mm (3/11)', category: 'Aggregates', stock: 24, unitOfMeasure: 'Percent', supplierId: 'SUP-001', dateAdded: '2023-01-01', description: 'Component for standard mix design.' },
    { id: 'RM-005', name: 'Water', category: 'Liquid', stock: 4, unitOfMeasure: 'Percent', supplierId: 'SUP-003', dateAdded: '2023-01-01', description: 'Component for standard mix design.' },
];

export const mockProducts: Product[] = [
    {
        id: 'P-WM-01',
        name: 'Wet Mix Macadam',
        sku: 'WET MIX',
        category: 'Aggregates',
        stock: 10000,
        unitOfMeasure: 'Ton',
        price: 50,
        unitCost: 35,
        currency: 'USD',
        status: 'In Stock',
        warehouse: 'Quarry Site A',
        dateAdded: '2023-01-01',
        supplier: 'Internal',
        batchNumber: 'BN-20230101-A',
        qualityTestStatus: 'Passed',
    }
];

export const mockSalesOrders: SalesOrder[] = [];

export const mockSalesTickets: SalesTicket[] = [];

export const mockPurchaseTickets: PurchaseTicket[] = [
    { id: 'PT-001', serialNo: 'SN-001', date: '2023-10-28', customerName: 'Central Quarry', truckNo: 'T-123', origin: 'Main Quarry', transporter: 'RAD INTERNATIONAL', materialCode: '10-20 mm (3/4")', timeIn: '09:00', timeOut: '09:30', tareWeight: 15000, poNo: 'PO-201', grossWeight: 45000, netWeight: 30000, driverName: 'John Doe', destination: 'DIC-100 ASPHALT PLANT', operatorName: 'Admin User', status: 'Received' },
    { id: 'PT-002', serialNo: 'SN-002', date: '2023-10-27', customerName: 'Ak Wissam Stone', truckNo: 'T-456', origin: 'Wissam Site', transporter: 'RAD INTERNATIONAL', materialCode: '0-5 mm (3/16")', timeIn: '11:00', timeOut: '11:45', tareWeight: 14500, poNo: 'PO-202', grossWeight: 46000, netWeight: 31500, driverName: 'Jane Smith', destination: 'DIC-100 ASPHALT PLANT', operatorName: 'Admin User', status: 'Received' },
    { id: 'PT-003', serialNo: 'SN-003', date: '2023-10-26', customerName: 'Raj Stones', truckNo: 'T-789', origin: 'Raj Quarry', transporter: 'Self', materialCode: '5-10 mm (3/8")', timeIn: '14:00', timeOut: '14:20', tareWeight: 16000, poNo: 'PO-203', grossWeight: 0, netWeight: 0, driverName: 'Raj Patel', destination: 'DIC-100 ASPHALT PLANT', operatorName: 'Admin User', status: 'Pending' },
    { id: 'PT-004', serialNo: 'SN-004', date: '2023-10-25', customerName: 'Al Jaber Crushers', truckNo: 'T-101', origin: 'Al Jaber Site', transporter: 'RAD INTERNATIONAL', materialCode: '10-20 mm (3/4")', timeIn: '16:00', timeOut: '16:30', tareWeight: 15500, poNo: 'PO-204', grossWeight: 45500, netWeight: 30000, driverName: 'Mohammed Ali', destination: 'DIC-100 ASPHALT PLANT', operatorName: 'Admin User', status: 'Cancelled' },
];

export const mockPurchaseOrders: PurchaseOrder[] = [];

export const mockWarehouses: Warehouse[] = [];

export const mockUsers: User[] = [
    { id: 'U001', name: 'Admin User', email: 'admin@bws.com', username: 'admin', password: 'bws123', roles: ['Admin'], designation: 'System Administrator', status: 'Active', avatarUrl: 'https://picsum.photos/seed/adminuser/200' },
    { id: 'U002', name: 'Accounts User', email: 'accounts@bws.com', username: 'accounts', password: 'acc123', roles: ['Accounts'], designation: 'Accountant', status: 'Active', avatarUrl: 'https://picsum.photos/seed/accountsuser/200' },
];
// FIX: Added mock data for sales charts, recent activity, and audit logs to resolve import errors.
export const mockSalesDataForChart: { name: string; sales: number; profit: number }[] = [];

export const mockRecentActivity: { id: number; user: string; action: string; timestamp: string }[] = [];

export const mockAuditLogs: AuditLog[] = [];