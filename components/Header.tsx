
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BulbOnIcon, BulbOffIcon, MenuIcon, BellIcon, DownloadIcon } from './IconComponents';
import FontSizeSelector from './FontSizeSelector';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
    const { theme, toggleTheme } = useTheme();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [isPushSupported, setIsPushSupported] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('default');
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        // Simple check to differentiate between desktop and mobile to show install button
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsDesktop(!isMobile);
        
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsPushSupported(true);
            setPermissionStatus(Notification.permission);
        }

        // PWA Install prompt logic
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault(); // Prevent the mini-infobar from appearing on mobile
            setInstallPromptEvent(event); // Stash the event so it can be triggered later.
        };
        
        // Check if the app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for the appinstalled event
        const handleAppInstalled = () => {
            setInstallPromptEvent(null); // Clear the deferred prompt
            setIsAppInstalled(true);
            console.log('PWA was installed');
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    const requestNotificationPermission = async () => {
        if (!isPushSupported) return;

        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);

        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // In a real app, you would get the subscription and send it to your server.
            // Example:
            // const registration = await navigator.serviceWorker.ready;
            // const subscription = await registration.pushManager.subscribe({
            //     userVisibleOnly: true,
            //     applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY_HERE'
            // });
            // console.log('Push subscription:', subscription);
        }
    };
    
    const simulatePushNotification = async () => {
        if (permissionStatus !== 'granted') {
            alert('Please enable notifications first.');
            return;
        }
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('Low Stock Alert!', {
            body: 'Asphalt Mix (Fine Grade) is running low. Only 15 units left.',
            icon: 'https://picsum.photos/192',
            badge: 'https://picsum.photos/192',
            data: { url: window.location.origin + '/#/inventory' }
        });
        setNotificationsOpen(false);
    };

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            return;
        }
        // Show the install prompt
        installPromptEvent.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await installPromptEvent.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, discard it
        setInstallPromptEvent(null);
    };


    return (
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm relative">
            <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none md:hidden">
                    <MenuIcon />
                </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                {isDesktop && installPromptEvent && !isAppInstalled && (
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 dark:focus:ring-offset-gray-800"
                        aria-label="Install app"
                        title="Install BWS Inventory App on your PC"
                    >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Install App
                    </button>
                )}
                <FontSizeSelector />
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <BulbOnIcon className="w-5 h-5" /> : <BulbOffIcon className="w-5 h-5" />}
                </button>
                
                <div className="relative">
                    <button
                        onClick={() => setNotificationsOpen(prev => !prev)}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none relative"
                        aria-label="Toggle notifications"
                    >
                        <BellIcon className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                    </button>
                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-20 border dark:border-gray-700">
                            <div className="p-4 font-semibold border-b dark:border-gray-700 text-gray-800 dark:text-white">Notifications</div>
                            <ul className="divide-y dark:divide-gray-700">
                                <li className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">New Sales Order #SO-105</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Created by Jane Smith</p>
                                </li>
                                <li className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Stock Alert: Washed Sand</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Only 850 units left in Quarry B.</p>
                                </li>
                            </ul>
                            
                            {isPushSupported && (
                                <div className="p-4 border-t dark:border-gray-700 space-y-2">
                                    {permissionStatus === 'default' && (
                                        <button onClick={requestNotificationPermission} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                            Enable Notifications
                                        </button>
                                    )}
                                    {permissionStatus === 'granted' && (
                                        <>
                                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">Notifications are enabled.</p>
                                            <button onClick={simulatePushNotification} className="w-full px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                                Test Low Stock Alert
                                            </button>
                                        </>
                                    )}
                                    {permissionStatus === 'denied' && (
                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                            Push notifications are blocked in browser settings.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 border-t dark:border-gray-700">
                                <a href="/#/notifications" onClick={() => setNotificationsOpen(false)} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">View all notifications</a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button onClick={() => setProfileOpen(prev => !prev)} className="flex items-center space-x-2">
                        <img className="h-9 w-9 rounded-full object-cover" src={currentUser?.avatarUrl || './images/users/default.png'} alt="Your avatar" />
                        <span className="hidden sm:inline font-medium text-gray-700 dark:text-gray-300">{currentUser?.name}</span>
                    </button>
                    {profileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border dark:border-gray-700">
                            <div className="p-2 border-b dark:border-gray-700">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{currentUser?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.roles.join(', ')} - {currentUser?.designation}</p>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;