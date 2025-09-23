// FIX: Imported test runner functions and types from 'vitest' to resolve 'Cannot find name' errors.
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import React, { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { DataProvider, useData } from './DataContext';
import { SettingsContext } from './SettingsContext';
import { Product } from '../types';
import * as idb from '../utils/idb';

// Mock the IndexedDB utility functions
vi.mock('../utils/idb', () => ({
    initDB: vi.fn().mockResolvedValue(true),
    loadData: vi.fn().mockImplementation((storeName) => {
        if (storeName === 'products') {
            return Promise.resolve([]); // Start with no products
        }
        return Promise.resolve([]);
    }),
    saveData: vi.fn().mockResolvedValue(undefined),
    addToQueue: vi.fn().mockResolvedValue(undefined),
}));

// Mock the settings context
const mockSettings = {
    defaultCurrency: 'USD',
    setDefaultCurrency: vi.fn(),
    lowStockThreshold: 1000,
    setLowStockThreshold: vi.fn(),
};

// A custom wrapper that provides both SettingsContext and DataContext
const AllProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
    <SettingsContext.Provider value={mockSettings}>
        <DataProvider>{children}</DataProvider>
    </SettingsContext.Provider>
);

describe('DataContext - Product Management', () => {

    beforeEach(() => {
        // Clear mocks before each test
        vi.clearAllMocks();
        // FIX: Corrected the type assertion for the mocked function from 'vi.Mock' to 'Mock'.
        // Reset IDB mock to return empty arrays for a clean slate
        (idb.loadData as Mock).mockResolvedValue([]);
    });

    it('should add a new product correctly', async () => {
        const { result } = renderHook(() => useData(), { wrapper: AllProviders });
        
        const newProductData: Omit<Product, 'id'> = {
            name: 'Test Gravel', sku: 'T-G-01', category: 'Aggregates', stock: 1500,
            unitOfMeasure: 'Ton', price: 50, unitCost: 30, currency: 'USD',
            status: 'In Stock', warehouse: 'Test Quarry', dateAdded: '2024-01-01',
            supplier: 'Test Supplier', batchNumber: 'B-01', qualityTestStatus: 'Passed',
        };

        await act(async () => {
            result.current.addProduct(newProductData);
        });
        
        expect(result.current.products).toHaveLength(1);
        const addedProduct = result.current.products[0];
        expect(addedProduct.name).toBe('Test Gravel');
        expect(addedProduct.stock).toBe(1500);
        expect(addedProduct.status).toBe('In Stock'); // 1500 > 1000 threshold
        expect(addedProduct.history).toEqual([]); // Initial history is empty
    });

    it('should calculate product status based on low stock threshold', async () => {
        const { result } = renderHook(() => useData(), { wrapper: AllProviders });

        const lowStockProduct: Omit<Product, 'id'> = {
            name: 'Low Stock Sand', sku: 'L-S-01', category: 'Aggregates', stock: 900,
            unitOfMeasure: 'Ton', price: 50, unitCost: 30, currency: 'USD',
            status: 'In Stock', // Initial status doesn't matter, it will be recalculated
            warehouse: 'Test Quarry', dateAdded: '2024-01-01', supplier: 'Test', batchNumber: 'B-02', qualityTestStatus: 'Passed',
        };

        const outOfStockProduct: Omit<Product, 'id'> = {
            name: 'Out of Stock Cement', sku: 'OOS-C-01', category: 'Binders', stock: 0,
            unitOfMeasure: 'Bag', price: 10, unitCost: 7, currency: 'USD',
            status: 'In Stock',
            warehouse: 'Test Plant', dateAdded: '2024-01-01', supplier: 'Test', batchNumber: 'B-03', qualityTestStatus: 'Passed',
        };

        await act(async () => {
            result.current.addProduct(lowStockProduct);
            result.current.addProduct(outOfStockProduct);
        });

        expect(result.current.products).toHaveLength(2);
        expect(result.current.products.find(p => p.sku === 'L-S-01')?.status).toBe('Low Stock');
        expect(result.current.products.find(p => p.sku === 'OOS-C-01')?.status).toBe('Out of Stock');
    });

    it('should update an existing product', async () => {
         const { result } = renderHook(() => useData(), { wrapper: AllProviders });

        // First, add a product to update
        const initialProduct: Omit<Product, 'id'> = {
            name: 'Initial Product', sku: 'I-P-01', category: 'Aggregates', stock: 2000,
            unitOfMeasure: 'Ton', price: 50, unitCost: 30, currency: 'USD', status: 'In Stock',
            warehouse: 'Quarry A', dateAdded: '2024-01-01', supplier: 'Initial', batchNumber: 'B-04', qualityTestStatus: 'Passed',
        };
        
        await act(async () => {
            result.current.addProduct(initialProduct);
        });

        const productToUpdate = { ...result.current.products[0], name: 'Updated Product Name', stock: 500 };
        
        await act(async () => {
            result.current.updateProduct(productToUpdate);
        });

        expect(result.current.products).toHaveLength(1);
        expect(result.current.products[0].name).toBe('Updated Product Name');
        expect(result.current.products[0].stock).toBe(500);
        expect(result.current.products[0].status).toBe('Low Stock'); // Status should be recalculated
    });

    it('should update product stock and add a history entry', async () => {
        const { result } = renderHook(() => useData(), { wrapper: AllProviders });
        
        const initialProduct: Omit<Product, 'id'> = {
            name: 'Stock Test Product', sku: 'S-T-01', category: 'Additives', stock: 150,
            unitOfMeasure: 'Bag', price: 100, unitCost: 80, currency: 'USD', status: 'In Stock',
            warehouse: 'Lab', dateAdded: '2024-01-01', supplier: 'Test', batchNumber: 'B-05', qualityTestStatus: 'Passed',
        };
        
        await act(async () => {
            result.current.addProduct(initialProduct);
        });

        const productId = result.current.products[0].id;
        
        // Test adding stock
        await act(async () => {
            result.current.updateProductStock(productId, 50, 'Received from PO-123', 'Test User');
        });
        
        let updatedProduct = result.current.products[0];
        expect(updatedProduct.stock).toBe(200);
        expect(updatedProduct.history).toHaveLength(1);
        expect(updatedProduct.history![0].action).toBe('+50 units. Reason: Received from PO-123');
        expect(updatedProduct.history![0].user).toBe('Test User');

        // Test removing stock
        await act(async () => {
            result.current.updateProductStock(productId, -75, 'Damaged stock', 'Test User');
        });

        updatedProduct = result.current.products[0];
        expect(updatedProduct.stock).toBe(125); // 200 - 75
        expect(updatedProduct.history).toHaveLength(2);
        expect(updatedProduct.history![0].action).toBe('-75 units. Reason: Damaged stock');
    });

    it('should delete specified products', async () => {
        const { result } = renderHook(() => useData(), { wrapper: AllProviders });

        // Add some products first
        await act(async () => {
            result.current.addProduct({ name: 'P1', sku: 'P1', stock: 100 } as Omit<Product, 'id'>);
            result.current.addProduct({ name: 'P2', sku: 'P2', stock: 200 } as Omit<Product, 'id'>);
            result.current.addProduct({ name: 'P3', sku: 'P3', stock: 300 } as Omit<Product, 'id'>);
        });

        expect(result.current.products).toHaveLength(3);
        const idsToDelete = [result.current.products[0].id, result.current.products[2].id];

        await act(async () => {
            result.current.deleteProducts(idsToDelete);
        });

        expect(result.current.products).toHaveLength(1);
        expect(result.current.products[0].sku).toBe('P2');
    });
});