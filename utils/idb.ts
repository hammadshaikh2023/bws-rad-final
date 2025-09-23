// IndexedDB utility functions

const DB_NAME = 'bws-inventory-db';
const DB_VERSION = 8; // Incremented version to add new stores

// Store names for cached data
export const PRODUCTS_STORE_NAME = 'products';
export const SALES_ORDERS_STORE_NAME = 'salesOrders';
export const SALES_TICKETS_STORE_NAME = 'salesTickets';
export const PURCHASE_TICKETS_STORE_NAME = 'purchaseTickets';
export const PURCHASE_ORDERS_STORE_NAME = 'purchaseOrders';
export const USERS_STORE_NAME = 'users';
export const SUPPLIERS_STORE_NAME = 'suppliers';
export const RAW_MATERIALS_STORE_NAME = 'rawMaterials';
export const REMINDERS_STORE_NAME = 'reminders';
export const GATE_PASS_STORE_NAME = 'gatePasses';
export const PACKING_SLIPS_STORE_NAME = 'packingSlips';
export const SHIPPING_LABELS_STORE_NAME = 'shippingLabels';
const SYNC_STORE_NAME = 'sync-queue';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Avoid re-opening the database if it's already open
    if (db) {
      return resolve(true);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject(false);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      const storesToCreate = [
          { name: SYNC_STORE_NAME, options: { autoIncrement: true, keyPath: 'id' } },
          { name: PRODUCTS_STORE_NAME, options: { keyPath: 'id' } },
          { name: SALES_ORDERS_STORE_NAME, options: { keyPath: 'id' } },
          { name: SALES_TICKETS_STORE_NAME, options: { keyPath: 'id' } },
          { name: PURCHASE_TICKETS_STORE_NAME, options: { keyPath: 'id' } },
          { name: PURCHASE_ORDERS_STORE_NAME, options: { keyPath: 'id' } },
          { name: USERS_STORE_NAME, options: { keyPath: 'id' } },
          { name: SUPPLIERS_STORE_NAME, options: { keyPath: 'id' } },
          { name: RAW_MATERIALS_STORE_NAME, options: { keyPath: 'id' } },
          { name: REMINDERS_STORE_NAME, options: { keyPath: 'id' } },
          { name: GATE_PASS_STORE_NAME, options: { keyPath: 'gatePassId' } },
          { name: PACKING_SLIPS_STORE_NAME, options: { keyPath: 'packingSlipId' } },
          { name: SHIPPING_LABELS_STORE_NAME, options: { keyPath: 'shippingLabelId' } },
      ];
      storesToCreate.forEach(storeInfo => {
          if (!dbInstance.objectStoreNames.contains(storeInfo.name)) {
              dbInstance.createObjectStore(storeInfo.name, storeInfo.options);
          }
      });
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log('Database initialized successfully.');
      resolve(true);
    };
  });
};

export const saveData = <T>(storeName: string, data: T[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject('Database not initialized.');
        }
        try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            store.clear(); // Clear old data before saving new data
            data.forEach(item => store.put(item));

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => {
                console.error(`Error saving data to ${storeName}:`, transaction.error);
                reject(transaction.error);
            };
        } catch (error) {
            console.error(`Failed to start transaction for ${storeName}:`, error);
            reject(error);
        }
    });
};

export const loadData = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject('Database not initialized.');
        }
        try {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error(`Error loading data from ${storeName}:`, request.error);
                reject(request.error);
            };
        } catch (error) {
            console.error(`Failed to start transaction for ${storeName}:`, error);
            reject(error);
        }
    });
};

export const addToQueue = (action: { type: string, payload: any }): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error('Database not initialized.');
      return reject('Database not initialized.');
    }
    const transaction = db.transaction([SYNC_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(SYNC_STORE_NAME);
    const request = store.add(action);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error('Error adding to queue:', request.error);
      reject(request.error);
    };
  });
};

export const getQueue = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('Database not initialized.');
            return reject('Database not initialized.');
        }
        const transaction = db.transaction([SYNC_STORE_NAME], 'readonly');
        const store = transaction.objectStore(SYNC_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            console.error('Error getting queue:', request.error);
            reject(request.error);
        };
    });
};

export const clearQueue = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('Database not initialized.');
            return reject('Database not initialized.');
        }
        const transaction = db.transaction([SYNC_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(SYNC_STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error clearing queue:', request.error);
            reject(request.error);
        };
    });
};