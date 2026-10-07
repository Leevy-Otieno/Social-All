import { useState, useEffect } from 'react';
import { AiOutlineClose, AiOutlineCloudDownload, AiOutlineBell } from 'react-icons/ai';

const PWAHandler = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [showNotifBanner, setShowNotifBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

        // Listen for Install Prompt (Android/Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Check if dismissed in THIS SESSION only
            // The user wants it to keep recommending until added, 
            // so we only hide it if they explicitly close it for now.
            if (!sessionStorage.getItem('pwa_banner_closed')) {
                setShowInstallBanner(true);
            }
        });

        // Notification Check (Delay to not overwhelm)
        if (Notification.permission === 'default' && !sessionStorage.getItem('pwa_banner_closed')) {
            const timer = setTimeout(() => {
                if (!showInstallBanner) setShowNotifBanner(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showInstallBanner]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBanner(false);
            localStorage.setItem('pwa_installed', 'true');
        }
    };

    const requestNotifications = async () => {
        const permission = await Notification.requestPermission();
        setShowNotifBanner(false);
        if (permission !== 'granted') {
            sessionStorage.setItem('pwa_banner_closed', 'true');
        }
    };

    const closeBanner = () => {
        setShowInstallBanner(false);
        setShowNotifBanner(false);
        // We use sessionStorage so it comes back on next visit/refresh 
        // until they actually install it.
        sessionStorage.setItem('pwa_banner_closed', 'true');
    };

    // If already in standalone mode, don't show anything
    if (isStandalone) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {/* Unified PWA / Notification Banner */}
            {(showInstallBanner || showNotifBanner || (isIOS && !sessionStorage.getItem('pwa_banner_closed'))) && (
                <div className="pointer-events-auto bg-white/90 backdrop-blur-2xl border border-slate-200 p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-bottom-10 duration-700 max-w-md mx-auto w-full relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
                    
                    <button 
                        onClick={closeBanner}
                        className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <AiOutlineClose size={18} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-lg transform rotate-3">
                            <img src="/icon.png" alt="App" className="w-10 h-10 object-contain" />
                        </div>
                        
                        <div className="flex-1 pr-6">
                            {showInstallBanner ? (
                                <>
                                    <h3 className="text-slate-900 font-bold text-sm leading-tight">Install YouBGram App</h3>
                                    <p className="text-slate-500 text-[10px] mt-0.5">Native experience • Faster • Offline support</p>
                                </>
                            ) : showNotifBanner ? (
                                <>
                                    <h3 className="text-slate-900 font-bold text-sm leading-tight">Enable Notifications</h3>
                                    <p className="text-slate-500 text-[10px] mt-0.5">Never miss a vibe • Real-time alerts</p>
                                </>
                            ) : isIOS ? (
                                <>
                                    <h3 className="text-slate-900 font-bold text-sm leading-tight">Add to Home Screen</h3>
                                    <p className="text-slate-500 text-[10px] mt-0.5">Tap <span className="font-bold">Share</span> then <span className="font-bold">Add to Home Screen</span></p>
                                </>
                            ) : null}
                        </div>

                        <div className="flex items-center">
                            {showInstallBanner ? (
                                <button 
                                    onClick={handleInstall}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <AiOutlineCloudDownload size={16} />
                                    Install
                                </button>
                            ) : showNotifBanner ? (
                                <button 
                                    onClick={requestNotifications}
                                    className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <AiOutlineBell size={16} />
                                    Enable
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PWAHandler;
