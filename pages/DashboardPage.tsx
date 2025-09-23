import React, { useMemo } from 'react';
import { AreaChart, Area, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { mockRecentActivity, mockSalesDataForChart } from '../data/mockData';
import { InventoryIcon, SalesIcon, PurchasesIcon, ClockIcon } from '../components/IconComponents';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; change?: string; changeType?: 'increase' | 'decrease' }> = ({ title, value, icon, change, changeType }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform hover:scale-105 duration-300">
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {change && (
                <p className={`text-xs font-semibold ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                    {change}
                </p>
            )}
        </div>
    </div>
);

const UpcomingReminders: React.FC = () => {
    const { reminders, updateReminderStatus } = useData();
    const pendingReminders = reminders
        .filter(r => r.status === 'Pending' && new Date(r.reminderDateTime) > new Date())
        .sort((a, b) => new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime())
        .slice(0, 5); // Show top 5 upcoming

    if (pendingReminders.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2 text-indigo-500"/>
                    Upcoming Reminders
                </h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No pending reminders.</p>
            </div>
        )
    }

    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-indigo-500"/>
                Upcoming Reminders
            </h3>
            <ul className="space-y-4">
                {pendingReminders.map(reminder => (
                    <li key={reminder.id} className="flex items-start justify-between">
                        <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{reminder.task}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                For Order: {reminder.orderId}
                            </p>
                            <p className="text-xs text-indigo-500 dark:text-indigo-400">
                                Due: {new Date(reminder.reminderDateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                        </div>
                        <button
                            onClick={() => updateReminderStatus(reminder.id, 'Completed')}
                            className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                            title="Mark as Complete"
                        >
                           ✔️
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const AdminDashboard: React.FC = () => {
    const { products, salesOrders } = useData();

    const totalRevenue = salesOrders
        .filter(o => o.status === 'Fulfilled')
        .reduce((sum, o) => sum + o.total, 0);

    const avgOrderValue = salesOrders.length > 0 ? totalRevenue / salesOrders.length : 0;
    const pendingOrdersCount = salesOrders.filter(o => o.status === 'Pending').length;
    const outOfStockCount = products.filter(p => p.status === 'Out of Stock').length;
    
    const orderStatusData = useMemo(() => {
        const statusCounts = salesOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    }, [salesOrders]);
    
    const COLORS = { 'Fulfilled': '#34d399', 'Pending': '#f59e0b', 'Cancelled': '#ef4444' };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="p-4 bg-gray-900/80 text-white rounded-lg shadow-lg">
              <p className="label font-bold">{`${label || payload[0].name}`}</p>
              {payload.map((entry: any, index: number) => (
                  <p key={`item-${index}`} style={{ color: entry.dataKey === 'sales' ? '#f97316' : (entry.color || entry.stroke) }}>
                      {`${entry.name}: ${entry.value.toLocaleString(undefined, {style: entry.dataKey === 'profit' || entry.dataKey === 'sales' ? 'currency' : 'decimal', currency: 'USD'})}`}
                  </p>
              ))}
            </div>
          );
        }
        return null;
    };
    
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}k`} icon={<SalesIcon className="w-6 h-6 text-indigo-500" />} change="+12.5% this month" changeType="increase"/>
                <StatCard title="Avg. Order Value" value={`$${avgOrderValue.toFixed(2)}`} icon={<SalesIcon className="w-6 h-6 text-indigo-500" />} />
                <StatCard title="Pending Orders" value={String(pendingOrdersCount)} icon={<PurchasesIcon className="w-6 h-6 text-indigo-500" />} />
                <StatCard title="Out of Stock Items" value={String(outOfStockCount)} icon={<InventoryIcon className="w-6 h-6 text-indigo-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Charts Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Sales Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Sales & Profit Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={mockSalesDataForChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value)/1000}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}} />
                                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                <Area type="monotone" dataKey="sales" stroke="#4f46e5" fill="url(#colorSales)" strokeWidth={2} />
                                <Area type="monotone" dataKey="profit" stroke="#34d399" fill="url(#colorProfit)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                     {/* Order Status Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Order Status Overview</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                 {/* FIX: Explicitly type the props for the label renderer to resolve TypeScript error. */}
                                 <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} labelLine={false} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                     {orderStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                     ))}
                                 </Pie>
                                 <Tooltip content={<CustomTooltip />} />
                                 <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Side Panels Column */}
                <div className="space-y-8">
                    <UpcomingReminders />
                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Recent Activity</h3>
                        <ul className="space-y-4">
                            {mockRecentActivity.map(activity => (
                                <li key={activity.id} className="flex items-start space-x-3">
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{activity.user.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{activity.action}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    return (
        <div className="text-center py-20">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Welcome, {currentUser?.name}!</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Use the sidebar to navigate to your tasks.
            </p>
        </div>
    );
}


const DashboardPage: React.FC = () => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.roles.includes('Admin');

    return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};

export default DashboardPage;