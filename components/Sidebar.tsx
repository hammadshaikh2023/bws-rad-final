


import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    DashboardIcon, InventoryIcon, SalesIcon, PurchasesIcon, WarehouseIcon, 
    FulfillmentIcon, ReportsIcon, SettingsIcon, AuditIcon, CloseIcon, 
    BellIcon, MaterialsIcon, VendorsIcon, MoreIcon, ChevronDownIcon 
} from './IconComponents';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const primaryNavItems = [
    { to: '/', icon: <DashboardIcon />, label: 'Dashboard', roles: ['Admin', 'User', 'Inventory Manager', 'Sales Representative', 'Warehouse Staff', 'Logistics', 'Security Guard', 'Accounts'] },
    { to: '/sales', icon: <SalesIcon />, label: 'Sales', roles: ['Admin', 'User', 'Sales Representative', 'Accounts'] },
    { to: '/purchases', icon: <PurchasesIcon />, label: 'Purchases', roles: ['Admin', 'User', 'Inventory Manager', 'Accounts'] },
    { to: '/materials', icon: <MaterialsIcon />, label: 'Materials', roles: ['Admin', 'Inventory Manager'] },
    { to: '/vendors', icon: <VendorsIcon />, label: 'Vendors', roles: ['Admin', 'Inventory Manager', 'User'] },
];

const moreOptionsNavItems = [
    { to: '/inventory', icon: <InventoryIcon />, label: 'Inventory', roles: ['Admin', 'User', 'Inventory Manager', 'Warehouse Staff'] },
    { to: '/warehouses', icon: <WarehouseIcon />, label: 'Warehouses', roles: ['Admin', 'User', 'Warehouse Staff'] },
    { to: '/fulfillment', icon: <FulfillmentIcon />, label: 'Fulfillment', roles: ['Admin', 'User', 'Logistics', 'Security Guard'] },
    { to: '/audit', icon: <AuditIcon />, label: 'Audit', roles: ['Admin'] },
    { to: '/reports', icon: <ReportsIcon />, label: 'Reports & Analytics', roles: ['Admin', 'Inventory Manager'] },
    { to: '/notifications', icon: <BellIcon />, label: 'Notifications', roles: ['Admin', 'User', 'Inventory Manager', 'Sales Representative', 'Warehouse Staff', 'Logistics', 'Security Guard'] },
    { to: '/settings', icon: <SettingsIcon />, label: 'Settings', roles: ['Admin', 'User', 'Inventory Manager', 'Sales Representative', 'Warehouse Staff', 'Logistics', 'Security Guard'] },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const { currentUser } = useAuth();
    const [isMoreOpen, setMoreOpen] = useState(false);

    const filterItemsByRole = (items: typeof primaryNavItems) => {
        return items.filter(item => 
            currentUser?.roles.some(role => item.roles.includes(role))
        );
    };

    const filteredPrimaryItems = filterItemsByRole(primaryNavItems);
    const filteredMoreItems = filterItemsByRole(moreOptionsNavItems);

    const navigationLinks = (isMobile: boolean) => (
        <nav className={`mt-5 px-2 space-y-1 ${isMobile ? '' : 'flex-1'}`}>
            {filteredPrimaryItems.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={({ isActive }) =>
                        `group flex items-center px-2 py-2 font-medium rounded-md ${
                            isMobile 
                                ? 'text-base' 
                                : `text-sm ${isActive 
                                    ? 'bg-indigo-100 text-indigo-900 dark:bg-gray-700 dark:text-white' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'}`
                        }`
                    }
                >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                </NavLink>
            ))}

            {filteredMoreItems.length > 0 && (
                 <div className="pt-2">
                    <button onClick={() => setMoreOpen(!isMoreOpen)} className="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
                        <MoreIcon />
                        <span className="ml-3 flex-1 text-left">More Options</span>
                        <ChevronDownIcon className={`w-5 h-5 transform transition-transform duration-150 ${isMoreOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMoreOpen && (
                        <div className="mt-1 space-y-1 pl-5">
                            {filteredMoreItems.map((item) => (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                            isActive
                                                ? 'bg-indigo-100 text-indigo-900 dark:bg-gray-700 dark:text-white'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                                        }`
                                    }
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </nav>
    );

    return (
        <>
            {/* Mobile menu */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? "block" : "hidden"}`} role="dialog" aria-modal="true">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
                            <span className="sr-only">Close sidebar</span>
                            <CloseIcon className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-shrink-0 flex items-center px-4 font-bold text-xl">
                             <span style={{ color: '#EF7722' }}>BWS</span>
                             <span className="dark:text-white"> Inventory</span>
                        </div>
                        {navigationLinks(true)}
                    </div>
                </div>
                <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
            </div>

            {/* Static sidebar for desktop */}
            <div className="hidden md:flex md:flex-shrink-0 no-print">
                <div className="flex flex-col w-64">
                    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                            <div className="flex items-center flex-shrink-0 px-4 font-bold text-xl">
                                <span style={{ color: '#EF7722' }}>BWS</span>
                                <span className="dark:text-white"> Inventory</span>
                            </div>
                            {navigationLinks(false)}
                        </div>
                         <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex-shrink-0 w-full group block">
                                <div className="flex items-center">
                                    <div>
                                        <img className="inline-block h-9 w-9 rounded-full" src={currentUser?.avatarUrl || './images/users/default.png'} alt="" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-700 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">
                                            {currentUser?.name}
                                        </p>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                                            View profile
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
