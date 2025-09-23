import React from 'react';

// Using a more comprehensive list of mock notifications for a dedicated page.
const mockNotifications = [
    { id: 1, title: 'New Sales Order #SO-105', description: 'Created by Jane Smith.', timestamp: '2023-10-28 11:45 AM', read: false },
    { id: 2, title: 'Stock Alert: Washed Sand', description: 'Only 850 units left in Quarry B.', timestamp: '2023-10-28 10:30 AM', read: false },
    { id: 3, title: 'Purchase Order PO-201 Received', description: 'All items have been received and stocked successfully.', timestamp: '2023-10-27 03:15 PM', read: true },
    { id: 4, title: 'System Maintenance Scheduled', description: 'The system will be down for scheduled maintenance on Oct 30, 2:00 AM.', timestamp: '2023-10-27 09:00 AM', read: true },
    { id: 5, title: 'User Kyle Reese account blocked', description: 'Account was blocked by Admin User due to security policy violation.', timestamp: '2023-10-26 05:00 PM', read: true },
    { id: 6, title: 'Quality Test Passed for Batch BN-20231005-L', description: 'Liquid Asphalt Binder batch has passed quality checks.', timestamp: '2023-10-26 02:10 PM', read: true },
    { id: 7, title: 'New Product Added', description: 'Admin User added "Crushed Stone #57" to the inventory.', timestamp: '2023-10-26 11:00 AM', read: true },
];

const NotificationsPage: React.FC = () => {
    // In a real app, this state would be managed globally (e.g., via context)
    const [notifications, setNotifications] = React.useState(mockNotifications);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Notifications</h2>
                <button 
                    onClick={markAllAsRead}
                    className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 focus:outline-none"
                >
                    Mark all as read
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map(notification => (
                        <li key={notification.id} className={`p-4 transition-colors duration-200 ${notification.read ? 'bg-gray-50/50 dark:bg-gray-800/50 opacity-70' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                            <div className="flex items-start space-x-4">
                                <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full mt-1.5 ${notification.read ? 'bg-gray-400' : 'bg-indigo-500 animate-pulse'}`}></div>
                                <div className="flex-1">
                                    <p className={`font-semibold ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{notification.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{notification.description}</p>
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                    {notification.timestamp}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                {notifications.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        You have no new notifications.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;