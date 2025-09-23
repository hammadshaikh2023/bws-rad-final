export type Currency = string;

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unitOfMeasure: 'Ton' | 'Cubic Meter' | 'Bag' | 'Drum';
  price: number;
  unitCost: number;
  currency: Currency;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  warehouse: string;
  dateAdded: string;
  supplier: string;
  batchNumber: string;
  qualityTestStatus: 'Pending' | 'Passed' | 'Failed';
  profitMargin?: number;
  history?: HistoryEntry[];
  expires?: string;
  imageUrl?: string;
  description?: string;
  reorderLevel?: number;
  location?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  stock: number;
  unitOfMeasure: 'Ton' | 'Cubic Meter' | 'Bag' | 'Drum' | 'Liter' | 'Kilogram' | 'Percent';
  supplierId: string;
  dateAdded: string;
  description?: string;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  user: string;
}

export interface SalesOrder {
  id: string;
  customer: {
    name: string;
    email: string;
    shippingAddress: string;
  };
  date: string;
  total: number;
  currency: Currency;
  status: 'Fulfilled' | 'Pending' | 'Cancelled';
  items: OrderItem[];
  history: HistoryEntry[];
}

export interface PurchaseOrder {
    id:string;
    vendor: {
        name: string;
        contactPerson: string;
    };
    date: string;
    total: number;
    currency: Currency;
    status: 'Received' | 'Pending' | 'Cancelled';
    items: OrderItem[];
    history: HistoryEntry[];
    trackingNumber?: string;
}

export interface Warehouse {
    id: string;
    name: string;
    location: string;
    capacity: number; // in Tons
    stockCount: number; // in Tons
    manager: string;
    contact: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    roles: string[];
    designation: string;
    status: 'Active' | 'Blocked';
    avatarUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    type: 'Sales' | 'Purchase' | 'Inventory' | 'User Management';
    action: string;
    details: string;
}

export interface GatePass {
    gatePassId: string;
    orderId: string; // Links to SalesOrder.id
    issueDate: string;
    driverName: string;
    driverContact: string;
    driverIdNumber: string;
    driverLicenseNumber: string;
    vehicleNumber: string;
    status: 'Issued' | 'Exited';
    clearedBy?: string;
    exitTimestamp?: string;
}

export interface PackingSlip {
    packingSlipId: string;
    orderId: string;
    issueDate: string;
}

export interface ShippingLabel {
    shippingLabelId: string;
    orderId: string;
    issueDate: string;
}

export interface Reminder {
    id: string;
    orderId: string;
    task: string;
    reminderDateTime: string;
    status: 'Pending' | 'Completed';
}

export interface SalesTicket {
  id: string; // Ticket No
  date: string;
  customerName: string;
  truckNo: string;
  materialDestination: string;
  transporter: string;
  materialCode: string; // This could link to Product SKU
  timeIn: string;
  sourceId?: string;
  timeOut: string;
  temperature?: number;
  tareWeight: number | string;
  lpoNo: string;
  grossWeight: number | string;
  driverName: string;
  netWeight: number | string;
  destination: string;
  operatorName: string;
}

export interface PurchaseTicket {
  id: string; // Ticket Number
  serialNo: string;
  date: string;
  customerName: string;
  truckNo: string; // Truck Number
  origin: string; // Source
  transporter: string;
  materialCode: string; // Materials
  timeIn: string;
  timeOut: string;
  temperature?: number;
  tareWeight: number | string;
  poNo: string; // Order No
  grossWeight: number | string;
  netWeight: number | string;
  driverName: string; // Truck Driver
  destination: string;
  operatorName: string;
  status: 'Received' | 'Pending' | 'Cancelled';
  notes?: string;
}