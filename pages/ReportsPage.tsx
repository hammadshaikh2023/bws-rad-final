import React from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { mockSalesDataForChart } from '../data/mockData';
import ExportDropdown from '../components/ExportDropdown';

const COLORS = ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 bg-gray-900/80 text-white rounded-lg shadow-lg">
          <p className="label font-bold">{`${label || payload[0].name}`}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color || pld.stroke }}>
              {`${pld.name}: ${pld.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
};

const ReportsPage: React.FC = () => {
    const { products, salesOrders } = useData();

    const stockByCategory = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + product.stock;
        return acc;
    }, {} as Record<string, number>);

    const stockByCategoryData = Object.entries(stockByCategory).map(([name, value]) => ({ name, value }));
    
    const exportableStockData = stockByCategoryData.map(item => ({ category: item.name, stock: item.value }));
    const exportStockColumns = [ { header: 'Category', accessor: 'category' as keyof typeof exportableStockData[0] }, { header: 'Total Stock', accessor: 'stock' as keyof typeof exportableStockData[0] } ];

    const exportableSalesData = mockSalesDataForChart;
    const exportSalesColumns = [ { header: 'Month', accessor: 'name' as keyof typeof exportableSalesData[0] }, { header: 'Sales', accessor: 'sales' as keyof typeof exportableSalesData[0] }, { header: 'Profit', accessor: 'profit' as keyof typeof exportableSalesData[0] } ];

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reports & Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Sales & Profit Overview</h3>
                        <ExportDropdown data={exportableSalesData} columns={exportSalesColumns} fileName="Sales_Overview" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={mockSalesDataForChart}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="sales" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSales)" />
                            <Area type="monotone" dataKey="profit" stroke="#34d399" fillOpacity={1} fill="url(#colorProfit)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Stock by Category</h3>
                        <ExportDropdown data={exportableStockData} columns={exportStockColumns} fileName="Stock_By_Category" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stockByCategoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                // FIX: Explicitly type the props for the label renderer to resolve TypeScript error.
                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {stockByCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// FIX: Added default export to resolve module import error.
export default ReportsPage;