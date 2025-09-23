

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product, SalesOrder, PurchaseOrder, OrderItem, User, Currency, GatePass, HistoryEntry, PackingSlip, ShippingLabel, Reminder, Supplier, RawMaterial, SalesTicket, PurchaseTicket } from '../types';
import { mockProducts, mockSalesOrders, mockPurchaseOrders, mockUsers, mockSuppliers, mockRawMaterials, mockSalesTickets, mockPurchaseTickets } from '../data/mockData';
import { useSettings } from './SettingsContext';
import * as idb from '../utils/idb';
import { 
    PRODUCTS_STORE_NAME, 
    SALES_ORDERS_STORE_NAME, 
    PURCHASE_ORDERS_STORE_NAME, 
    USERS_STORE_NAME,
    REMINDERS_STORE_NAME,
    GATE_PASS_STORE_NAME,
    PACKING_SLIPS_STORE_NAME,
    SHIPPING_LABELS_STORE_NAME,
    SUPPLIERS_STORE_NAME,
    RAW_MATERIALS_STORE_NAME,
    SALES_TICKETS_STORE_NAME,
    PURCHASE_TICKETS_STORE_NAME,
} from '../utils/idb';

interface DataContextType {
    products: Product[];
    rawMaterials: RawMaterial[];
    salesOrders: SalesOrder[];
    salesTickets: SalesTicket[];
    purchaseTickets: PurchaseTicket[];
    purchaseOrders: PurchaseOrder[];
    users: User[];
    suppliers: Supplier[];
    gatePasses: GatePass[];
    packingSlips: PackingSlip[];
    shippingLabels: ShippingLabel[];
    reminders: Reminder[];
    categories: string[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    addRawMaterial: (material: Omit<RawMaterial, 'id'>) => void;
    updateRawMaterial: (material: RawMaterial) => void;
    updateProduct: (product: Product, updatedBy?: string) => void;
    deleteProducts: (productIds: string[]) => void;
    deleteRawMaterials: (materialIds: string[]) => void;
    updateProductStatus: (productIds: string[], status: Product['status']) => void;
    addSalesOrder: (order: Omit<SalesOrder, 'id' | 'total' | 'status' | 'history'>, userName: string) => void;
    addSalesTicket: (ticket: SalesTicket) => void;
    updateSalesTicket: (ticket: SalesTicket) => void;
    deleteSalesTicket: (ticketId: string) => void;
    addPurchaseTicket: (ticket: PurchaseTicket) => void;
    updatePurchaseTicket: (ticket: PurchaseTicket) => void;
    deletePurchaseTicket: (ticketId: string) => void;
    addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'total' | 'status' | 'history'>, userName: string) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
    updateSupplier: (supplier: Supplier) => void;
    deleteSuppliers: (supplierIds: string[]) => void;
    addGatePass: (gatePass: Omit<GatePass, 'gatePassId' | 'issueDate' | 'status'>) => void;
    updateGatePassStatus: (gatePassId: string, clearedByUser: string) => void;
    addPackingSlip: (packingSlip: { orderId: string }) => void;
    addShippingLabel: (shippingLabel: { orderId: string }) => void;
    addReminder: (reminderData: Omit<Reminder, 'id' | 'status'>) => void;
    updateReminderStatus: (reminderId: string, status: Reminder['status']) => void;
    updateSalesOrderStatus: (orderId: string, status: SalesOrder['status'], userName: string) => void;
    updatePurchaseOrderStatus: (orderId: string, status: PurchaseOrder['status'], userName: string) => void;
    updatePurchaseOrderTrackingNumber: (orderId: string, trackingNumber: string, userName: string) => void;
    updateProductStock: (productId: string, quantityChange: number, reason: string, userName: string) => void;
    addCategory: (category: string) => void;
    renameCategory: (oldName: string, newName: string) => void;
    deleteCategory: (category: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const performOrQueueUpdate = async (action: { type: string; payload: any }) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window && !navigator.onLine) {
        try {
            await idb.addToQueue(action);
            const registration = await navigator.serviceWorker.ready;
            // FIX: Cast registration to 'any' to access the 'sync' property.
            // The 'sync' property is part of the Background Sync API, which may not be in the default ServiceWorkerRegistration type.
            // The runtime check for 'SyncManager' in window ensures this is safe.
            await (registration as any).sync.register('bws-sync');
            console.log('Offline action queued for sync:', action);
        } catch (error) {
            console.error('Failed to queue action for sync:', error);
        }
    } else {
        // In a real app, this is where you would make the API call.
        console.log('Online action performed (simulated API call):', action);
    }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { lowStockThreshold } = useSettings();
    const [products, setProducts] = useState<Product[]>([]);
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [salesTickets, setSalesTickets] = useState<SalesTicket[]>([]);
    const [purchaseTickets, setPurchaseTickets] = useState<PurchaseTicket[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
    const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([]);
    const [shippingLabels, setShippingLabels] = useState<ShippingLabel[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [categories, setCategories] = useState<string[]>(['Uncategorized', 'Aggregates', 'Binders', 'Additives', 'Lab Supplies']);
    
    useEffect(() => {
        const loadAndCacheData = async () => {
            try {
                // 1. Initialize DB
                await idb.initDB();
                
                // 2. Load from IndexedDB first for fast initial load and offline support
                const cachedProducts = await idb.loadData<Product>(PRODUCTS_STORE_NAME);
                const cachedRawMaterials = await idb.loadData<RawMaterial>(RAW_MATERIALS_STORE_NAME);
                const cachedSalesOrders = await idb.loadData<SalesOrder>(SALES_ORDERS_STORE_NAME);
                const cachedSalesTickets = await idb.loadData<SalesTicket>(SALES_TICKETS_STORE_NAME);
                const cachedPurchaseTickets = await idb.loadData<PurchaseTicket>(PURCHASE_TICKETS_STORE_NAME);
                const cachedPurchaseOrders = await idb.loadData<PurchaseOrder>(PURCHASE_ORDERS_STORE_NAME);
                const cachedUsers = await idb.loadData<User>(USERS_STORE_NAME);
                const cachedSuppliers = await idb.loadData<Supplier>(SUPPLIERS_STORE_NAME);
                const cachedReminders = await idb.loadData<Reminder>(REMINDERS_STORE_NAME);
                const cachedGatePasses = await idb.loadData<GatePass>(GATE_PASS_STORE_NAME);
                const cachedPackingSlips = await idb.loadData<PackingSlip>(PACKING_SLIPS_STORE_NAME);
                const cachedShippingLabels = await idb.loadData<ShippingLabel>(SHIPPING_LABELS_STORE_NAME);


                if (cachedProducts.length > 0) setProducts(cachedProducts);
                if (cachedRawMaterials.length > 0) setRawMaterials(cachedRawMaterials);
                if (cachedSalesOrders.length > 0) setSalesOrders(cachedSalesOrders);
                if (cachedSalesTickets.length > 0) setSalesTickets(cachedSalesTickets);
                if (cachedPurchaseTickets.length > 0) setPurchaseTickets(cachedPurchaseTickets);
                if (cachedPurchaseOrders.length > 0) setPurchaseOrders(cachedPurchaseOrders);
                if (cachedUsers.length > 0) setUsers(cachedUsers);
                if (cachedSuppliers.length > 0) setSuppliers(cachedSuppliers);
                if (cachedReminders.length > 0) setReminders(cachedReminders);
                if (cachedGatePasses.length > 0) setGatePasses(cachedGatePasses);
                if (cachedPackingSlips.length > 0) setPackingSlips(cachedPackingSlips);
                if (cachedShippingLabels.length > 0) setShippingLabels(cachedShippingLabels);


                console.log('Loaded data from IndexedDB cache.');

                // 3. If online, fetch fresh data and update cache
                if (navigator.onLine) {
                    console.log('Online. Fetching fresh data...');
                    // Simulate API fetch with mock data
                    const freshProducts = mockProducts;
                    const freshRawMaterials = mockRawMaterials;
                    const freshSalesOrders = mockSalesOrders;
                    const freshSalesTickets = mockSalesTickets;
                    const freshPurchaseTickets = mockPurchaseTickets;
                    const freshPurchaseOrders = mockPurchaseOrders;
                    const freshUsers = mockUsers;
                    const freshSuppliers = mockSuppliers;
                    
                    // Update state
                    setProducts(freshProducts);
                    setRawMaterials(freshRawMaterials);
                    setSalesOrders(freshSalesOrders);
                    setSalesTickets(freshSalesTickets);
                    setPurchaseTickets(freshPurchaseTickets);
                    setPurchaseOrders(freshPurchaseOrders);
                    setUsers(freshUsers);
                    setSuppliers(freshSuppliers);
                    // Only overwrite user-generated data if cache is empty
                    if (cachedReminders.length === 0) setReminders([]);
                    if (cachedGatePasses.length === 0) setGatePasses([]);
                    if (cachedPackingSlips.length === 0) setPackingSlips([]);
                    if (cachedShippingLabels.length === 0) setShippingLabels([]);
                    
                    // Update cache
                    await idb.saveData(PRODUCTS_STORE_NAME, freshProducts);
                    await idb.saveData(RAW_MATERIALS_STORE_NAME, freshRawMaterials);
                    await idb.saveData(SALES_ORDERS_STORE_NAME, freshSalesOrders);
                    await idb.saveData(SALES_TICKETS_STORE_NAME, freshSalesTickets);
                    await idb.saveData(PURCHASE_TICKETS_STORE_NAME, freshPurchaseTickets);
                    await idb.saveData(PURCHASE_ORDERS_STORE_NAME, freshPurchaseOrders);
                    await idb.saveData(USERS_STORE_NAME, freshUsers);
                    await idb.saveData(SUPPLIERS_STORE_NAME, freshSuppliers);


                    console.log('Updated state and IndexedDB with fresh data.');
                } else {
                     console.log('Offline. Using cached data.');
                     // If we are offline and cache was empty, populate with mock data for demo purposes.
                     if(cachedProducts.length === 0) setProducts(mockProducts);
                     if(cachedRawMaterials.length === 0) setRawMaterials(mockRawMaterials);
                     if(cachedSalesOrders.length === 0) setSalesOrders(mockSalesOrders);
                     if(cachedSalesTickets.length === 0) setSalesTickets(mockSalesTickets);
                     if(cachedPurchaseTickets.length === 0) setPurchaseTickets(mockPurchaseTickets);
                     if(cachedPurchaseOrders.length === 0) setPurchaseOrders(mockPurchaseOrders);
                     if(cachedUsers.length === 0) setUsers(mockUsers);
                     if(cachedSuppliers.length === 0) setSuppliers(mockSuppliers);
                }

            } catch (error) {
                console.error("Failed to load or cache data:", error);
                // Fallback to mock data if IDB fails completely
                setProducts(mockProducts);
                setRawMaterials(mockRawMaterials);
                setSalesOrders(mockSalesOrders);
                setSalesTickets(mockSalesTickets);
                setPurchaseTickets(mockPurchaseTickets);
                setPurchaseOrders(mockPurchaseOrders);
                setUsers(mockUsers);
                setSuppliers(mockSuppliers);
            }
        };

        loadAndCacheData();
    }, []);

    const getProductStatus = (stock: number): Product['status'] => {
        if (stock <= 0) {
            return 'Out of Stock';
        }
        if (stock < lowStockThreshold) {
            return 'Low Stock';
        }
        return 'In Stock';
    };

    const updateProductStock = (productId: string, quantityChange: number, reason: string, userName: string) => {
        setProducts(prevProducts =>
            prevProducts.map(p => {
                if (p.id === productId) {
                    const currentStock = Number(p.stock) || 0;
                    const newStock = currentStock + quantityChange;
                    const newStatus = getProductStatus(newStock);
                    const newHistoryEntry: HistoryEntry = {
                        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                        action: `${quantityChange > 0 ? '+' : ''}${quantityChange} units. Reason: ${reason}`,
                        user: userName,
                    };
                    const newHistory = [newHistoryEntry, ...(p.history || [])];

                    return { ...p, stock: newStock < 0 ? 0 : newStock, status: newStatus, history: newHistory };
                }
                return p;
            })
        );
        performOrQueueUpdate({ type: 'UPDATE_PRODUCT_STOCK', payload: { productId, quantityChange, reason, userName } });
    };

    const addProduct = (product: Omit<Product, 'id'>) => {
        const newProduct: Product = {
            ...product,
            id: `P-${String(Date.now()).slice(-4)}`, // Use timestamp for more unique ID in demo
            status: getProductStatus(product.stock || 0),
            history: [],
        };
        setProducts(prev => [newProduct, ...prev]);
        performOrQueueUpdate({ type: 'ADD_PRODUCT', payload: newProduct });
    };

    const addRawMaterial = (material: Omit<RawMaterial, 'id'>) => {
        const newMaterial: RawMaterial = {
            ...material,
            id: `RM-${String(Date.now()).slice(-4)}`,
        };
        const updatedMaterials = [newMaterial, ...rawMaterials];
        setRawMaterials(updatedMaterials);
        idb.saveData(RAW_MATERIALS_STORE_NAME, updatedMaterials);
    };

    const updateRawMaterial = (updatedMaterial: RawMaterial) => {
        const updatedMaterials = rawMaterials.map(m => m.id === updatedMaterial.id ? updatedMaterial : m);
        setRawMaterials(updatedMaterials);
        idb.saveData(RAW_MATERIALS_STORE_NAME, updatedMaterials);
    };
    
    const deleteRawMaterials = (materialIds: string[]) => {
        const updatedMaterials = rawMaterials.filter(m => !materialIds.includes(m.id));
        setRawMaterials(updatedMaterials);
        idb.saveData(RAW_MATERIALS_STORE_NAME, updatedMaterials);
    };
    
    const updateProduct = (updatedProduct: Product, updatedBy: string = 'System') => {
        const originalProduct = products.find(p => p.id === updatedProduct.id);
        if (!originalProduct) return;

        let finalProduct = { ...updatedProduct };

        // Check if stock was changed via the edit form
        if (originalProduct.stock !== updatedProduct.stock) {
            const stockChange = updatedProduct.stock - originalProduct.stock;
             const newHistoryEntry: HistoryEntry = {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                action: `Stock adjusted by ${stockChange > 0 ? '+' : ''}${stockChange} units via product edit.`,
                user: updatedBy,
            };
            finalProduct.history = [newHistoryEntry, ...(updatedProduct.history || [])];
        }

        finalProduct.status = getProductStatus(finalProduct.stock || 0);
        
        setProducts(prevProducts => prevProducts.map(p => p.id === finalProduct.id ? finalProduct : p));
        performOrQueueUpdate({ type: 'UPDATE_PRODUCT', payload: finalProduct });
    }

    const deleteProducts = (productIds: string[]) => {
        setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
        performOrQueueUpdate({ type: 'DELETE_PRODUCTS', payload: { productIds } });
    };

    const updateProductStatus = (productIds: string[], status: Product['status']) => {
        setProducts(prev =>
            prev.map(p =>
                productIds.includes(p.id) ? { ...p, status: status } : p
            )
        );
        performOrQueueUpdate({ type: 'UPDATE_PRODUCT_STATUS', payload: { productIds, status } });
    };

    const addSalesOrder = (order: Omit<SalesOrder, 'id' | 'total' | 'status' | 'history'>, userName: string) => {
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const newOrder: SalesOrder = {
            ...order,
            id: `SO-${Date.now().toString().slice(-4)}`,
            total,
            status: 'Pending',
            history: [{
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                action: 'Order Created',
                user: userName
            }]
        };

        setSalesOrders(prev => [newOrder, ...prev]);
        performOrQueueUpdate({ type: 'ADD_SALES_ORDER', payload: newOrder });

        order.items.forEach(item => {
            if(item.productId){
                updateProductStock(item.productId, -item.quantity, `Created Sales Order ${newOrder.id}`, userName);
            }
        });
    };

    const addSalesTicket = (ticket: SalesTicket) => {
        const updatedTickets = [ticket, ...salesTickets];
        setSalesTickets(updatedTickets);
        idb.saveData(SALES_TICKETS_STORE_NAME, updatedTickets);
    };

    const updateSalesTicket = (ticket: SalesTicket) => {
        const updatedTickets = salesTickets.map(t => (t.id === ticket.id ? ticket : t));
        setSalesTickets(updatedTickets);
        idb.saveData(SALES_TICKETS_STORE_NAME, updatedTickets);
    };

    const deleteSalesTicket = (ticketId: string) => {
        const updatedTickets = salesTickets.filter(t => t.id !== ticketId);
        setSalesTickets(updatedTickets);
        idb.saveData(SALES_TICKETS_STORE_NAME, updatedTickets);
    };

    const addPurchaseTicket = (ticket: PurchaseTicket) => {
        const updatedTickets = [ticket, ...purchaseTickets];
        setPurchaseTickets(updatedTickets);
        idb.saveData(PURCHASE_TICKETS_STORE_NAME, updatedTickets);
    };

    const updatePurchaseTicket = (ticket: PurchaseTicket) => {
        const updatedTickets = purchaseTickets.map(t => (t.id === ticket.id ? ticket : t));
        setPurchaseTickets(updatedTickets);
        idb.saveData(PURCHASE_TICKETS_STORE_NAME, updatedTickets);
    };

    const deletePurchaseTicket = (ticketId: string) => {
        const updatedTickets = purchaseTickets.filter(t => t.id !== ticketId);
        setPurchaseTickets(updatedTickets);
        idb.saveData(PURCHASE_TICKETS_STORE_NAME, updatedTickets);
    };

    const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id' | 'total' | 'status' | 'history'>, userName: string) => {
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const newOrder: PurchaseOrder = {
            ...order,
            id: `PO-${Date.now().toString().slice(-4)}`,
            total,
            status: 'Pending',
            history: [{
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                action: 'Order Created',
                user: userName
            }]
        };

        setPurchaseOrders(prev => [newOrder, ...prev]);
        performOrQueueUpdate({ type: 'ADD_PURCHASE_ORDER', payload: newOrder });
    };
    
    const updateSalesOrderStatus = (orderId: string, newStatus: SalesOrder['status'], userName: string) => {
        const originalOrder = salesOrders.find(o => o.id === orderId);
        if (!originalOrder || originalOrder.status === newStatus) {
            return; // No change needed
        }
    
        const oldStatus = originalOrder.status;
    
        // --- Stock Adjustment Logic ---
        // From Cancelled to Pending: Re-deduct stock
        if (oldStatus === 'Cancelled' && newStatus === 'Pending') {
            originalOrder.items.forEach(item => {
                updateProductStock(item.productId, -item.quantity, `Reverted from Cancelled for SO #${orderId}`, userName);
            });
        }
        // From Pending/Fulfilled to Cancelled: Return stock
        else if ((oldStatus === 'Pending' || oldStatus === 'Fulfilled') && newStatus === 'Cancelled') {
            originalOrder.items.forEach(item => {
                updateProductStock(item.productId, item.quantity, `Cancelled SO #${orderId}`, userName);
            });
        }
        // From Fulfilled to Pending: No change in stock, it was already deducted.
        
        // Update the order state
        setSalesOrders(prev => prev.map(order => {
            if (order.id === orderId) {
                const newHistoryEntry: HistoryEntry = {
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    action: `Status changed from ${oldStatus} to ${newStatus}`, // More descriptive
                    user: userName
                };
                return { ...order, status: newStatus, history: [newHistoryEntry, ...order.history] };
            }
            return order;
        }));
        
        performOrQueueUpdate({ type: 'UPDATE_SALES_ORDER_STATUS', payload: { orderId, status: newStatus, userName } });
    };

    const updatePurchaseOrderStatus = (orderId: string, newStatus: PurchaseOrder['status'], userName: string) => {
        let updatedOrder: PurchaseOrder | undefined;
        const originalOrder = purchaseOrders.find(o => o.id === orderId);
        if (!originalOrder) return;
    
        setPurchaseOrders(prev => prev.map(order => {
            if (order.id === orderId) {
                const newHistoryEntry: HistoryEntry = {
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    action: `Status changed from ${order.status} to ${newStatus}`,
                    user: userName
                };
    
                // If status changed TO Received from something else
                if (newStatus === 'Received' && order.status !== 'Received') {
                    order.items.forEach(item => {
                        if(item.productId) {
                            updateProductStock(item.productId, item.quantity, `Received from PO ${order.id}`, userName);
                        }
                    });
                }
                // If status changed FROM Received to something else
                else if (order.status === 'Received' && newStatus !== 'Received') {
                     order.items.forEach(item => {
                        if(item.productId) {
                            updateProductStock(item.productId, -item.quantity, `Reverted status on PO ${order.id}`, userName);
                        }
                    });
                }
    
                updatedOrder = { ...order, status: newStatus, history: [newHistoryEntry, ...order.history] };
                return updatedOrder;
            }
            return order;
        }));
    
        if (updatedOrder) {
            performOrQueueUpdate({ type: 'UPDATE_PURCHASE_ORDER_STATUS', payload: { orderId, status: newStatus, userName } });
        }
    };

    const updatePurchaseOrderTrackingNumber = (orderId: string, trackingNumber: string, userName: string) => {
        let updatedOrder: PurchaseOrder | undefined;
        setPurchaseOrders(prev => prev.map(order => {
            if (order.id === orderId) {
                const newHistoryEntry: HistoryEntry = {
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    action: `Tracking number updated`,
                    user: userName
                };
                updatedOrder = { ...order, trackingNumber, history: [newHistoryEntry, ...order.history] };
                return updatedOrder;
            }
            return order;
        }));
        if (updatedOrder) {
            performOrQueueUpdate({ type: 'UPDATE_PO_TRACKING', payload: { orderId, trackingNumber, userName } });
        }
    };


    const addUser = (user: Omit<User, 'id'>) => {
        const dummyAvatars = [
            './images/users/new1.png',
            './images/users/new2.png',
            './images/users/new3.png',
            './images/users/new4.png'
        ];
        const randomAvatar = dummyAvatars[Math.floor(Math.random() * dummyAvatars.length)];

        const newUser: User = {
            ...user,
            id: `U-${String(Date.now()).slice(-4)}`,
            avatarUrl: randomAvatar,
        };
        setUsers(prev => [newUser, ...prev]);
        performOrQueueUpdate({ type: 'ADD_USER', payload: newUser });
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
        performOrQueueUpdate({ type: 'UPDATE_USER', payload: updatedUser });
    };

    const addSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
        const newSupplier: Supplier = {
            ...supplierData,
            id: `SUP-${String(Date.now()).slice(-4)}`,
        };
        const updatedSuppliers = [newSupplier, ...suppliers].sort((a,b) => a.name.localeCompare(b.name));
        setSuppliers(updatedSuppliers);
        idb.saveData(SUPPLIERS_STORE_NAME, updatedSuppliers);
        return newSupplier;
    };

    const updateSupplier = (updatedSupplier: Supplier) => {
        const newSuppliers = suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s);
        setSuppliers(newSuppliers);
        idb.saveData(SUPPLIERS_STORE_NAME, newSuppliers);
    };

    const deleteSuppliers = (supplierIds: string[]) => {
        const newSuppliers = suppliers.filter(s => !supplierIds.includes(s.id));
        setSuppliers(newSuppliers);
        idb.saveData(SUPPLIERS_STORE_NAME, newSuppliers);
    };

    const addGatePass = (gatePassData: Omit<GatePass, 'gatePassId' | 'issueDate' | 'status'>) => {
        const newGatePass: GatePass = {
            ...gatePassData,
            gatePassId: `GP-${String(Date.now()).slice(-4)}`,
            issueDate: new Date().toISOString(),
            status: 'Issued',
        };
        setGatePasses(prev => [newGatePass, ...prev]);
        performOrQueueUpdate({ type: 'ADD_GATE_PASS', payload: newGatePass });
    };

    const updateGatePassStatus = (gatePassId: string, clearedByUser: string) => {
        let gatePassToUpdate: GatePass | undefined;
        
        setGatePasses(prev => prev.map(gp => {
            if (gp.gatePassId === gatePassId) {
                gatePassToUpdate = {
                    ...gp,
                    status: 'Exited',
                    clearedBy: clearedByUser,
                    exitTimestamp: new Date().toISOString(),
                };
                return gatePassToUpdate;
            }
            return gp;
        }));

        if (gatePassToUpdate) {
            setSalesOrders(prev => prev.map(order => {
                if (order.id === gatePassToUpdate!.orderId) {
                     const newHistoryEntry: HistoryEntry = {
                        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                        action: `Vehicle cleared for exit by security guard ${clearedByUser}.`,
                        user: clearedByUser
                    };
                    return { ...order, history: [newHistoryEntry, ...order.history] };
                }
                return order;
            }));
            performOrQueueUpdate({ type: 'UPDATE_GATE_PASS_STATUS', payload: { gatePassId, clearedByUser } });
        }
    };

    const addPackingSlip = (packingSlipData: { orderId: string }) => {
        const newPackingSlip: PackingSlip = {
            ...packingSlipData,
            packingSlipId: `PS-${String(Date.now()).slice(-4)}`,
            issueDate: new Date().toISOString(),
        };
        setPackingSlips(prev => [newPackingSlip, ...prev]);
        performOrQueueUpdate({ type: 'ADD_PACKING_SLIP', payload: newPackingSlip });
    };

    const addShippingLabel = (shippingLabelData: { orderId: string }) => {
        const newShippingLabel: ShippingLabel = {
            ...shippingLabelData,
            shippingLabelId: `SL-${String(Date.now()).slice(-4)}`,
            issueDate: new Date().toISOString(),
        };
        setShippingLabels(prev => [newShippingLabel, ...prev]);
        performOrQueueUpdate({ type: 'ADD_SHIPPING_LABEL', payload: newShippingLabel });
    };

    const addReminder = (reminderData: Omit<Reminder, 'id' | 'status'>) => {
        const newReminder: Reminder = {
            ...reminderData,
            id: `REM-${String(Date.now()).slice(-6)}`,
            status: 'Pending',
        };
        const updatedReminders = [newReminder, ...reminders].sort((a, b) => new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime());
        setReminders(updatedReminders);
        idb.saveData(REMINDERS_STORE_NAME, updatedReminders); // Persist to IDB
        performOrQueueUpdate({ type: 'ADD_REMINDER', payload: newReminder });
    };

    const updateReminderStatus = (reminderId: string, status: Reminder['status']) => {
        const updatedReminders = reminders.map(r => (r.id === reminderId ? { ...r, status } : r));
        setReminders(updatedReminders);
        idb.saveData(REMINDERS_STORE_NAME, updatedReminders); // Persist to IDB
        performOrQueueUpdate({ type: 'UPDATE_REMINDER_STATUS', payload: { reminderId, status } });
    };

    const addCategory = (category: string) => {
        setCategories(prev => [...prev, category].sort());
    };
    
    const renameCategory = (oldName: string, newName: string) => {
        if (oldName === 'Uncategorized') {
            alert("The 'Uncategorized' category cannot be renamed.");
            return;
        }
        setCategories(prev => prev.map(c => (c === oldName ? newName : c)).sort());
        // Also update all products using this category
        setProducts(prev => prev.map(p => (p.category === oldName ? { ...p, category: newName } : p)));
    };
    
    const deleteCategory = (category: string) => {
        // Prevent deletion of the default category
        if (category === 'Uncategorized') {
            alert("The 'Uncategorized' category cannot be deleted.");
            return;
        }

        // Move products from the deleted category to 'Uncategorized'
        setProducts(prevProducts => 
            prevProducts.map(p => 
                p.category === category ? { ...p, category: 'Uncategorized' } : p
            )
        );

        // Update the categories list: remove the deleted one, and ensure 'Uncategorized' exists.
        setCategories(prevCategories => {
            const newCategoryList = prevCategories.filter(c => c !== category);
            if (!newCategoryList.includes('Uncategorized')) {
                newCategoryList.push('Uncategorized');
                newCategoryList.sort();
            }
            return newCategoryList;
        });
    };

    return (
        <DataContext.Provider value={{ products, rawMaterials, salesOrders, salesTickets, purchaseTickets, purchaseOrders, users, suppliers, gatePasses, packingSlips, shippingLabels, reminders, categories, addProduct, addRawMaterial, updateRawMaterial, updateProduct, deleteProducts, deleteRawMaterials, updateProductStatus, addSalesOrder, addSalesTicket, updateSalesTicket, deleteSalesTicket, addPurchaseTicket, updatePurchaseTicket, deletePurchaseTicket, addPurchaseOrder, addUser, updateUser, addSupplier, updateSupplier, deleteSuppliers, addGatePass, addPackingSlip, addShippingLabel, addReminder, updateReminderStatus, updateSalesOrderStatus, updatePurchaseOrderStatus, updatePurchaseOrderTrackingNumber, updateProductStock, updateGatePassStatus, addCategory, renameCategory, deleteCategory }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};