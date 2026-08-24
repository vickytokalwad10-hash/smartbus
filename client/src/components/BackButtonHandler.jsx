import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const BackButtonHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackPressTime = useRef(0);
  const currentPath = useRef(location.pathname);

  // Keep track of current path without needing to re-bind listeners
  useEffect(() => {
    currentPath.current = location.pathname;
  }, [location]);

  const homeRoutes = [
    '/', 
    '/login', 
    '/student/dashboard', 
    '/teacher/dashboard', 
    '/driver/dashboard', 
    '/admin/dashboard'
  ];

  const showToast = (message) => {
    const existing = document.getElementById('app-exit-toast');
    if (existing) {
      existing.remove();
    }
    const toast = document.createElement('div');
    toast.id = 'app-exit-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#322f35';
    toast.style.color = '#f5eff7';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, 2000);
  };

  useEffect(() => {
    let backButtonListener = null;

    if (Capacitor.isNativePlatform()) {
      const setupListener = async () => {
        backButtonListener = await CapacitorApp.addListener('backButton', () => {
          if (homeRoutes.includes(currentPath.current)) {
            const currentTime = new Date().getTime();
            if (currentTime - lastBackPressTime.current < 2000) {
              CapacitorApp.exitApp();
            } else {
              lastBackPressTime.current = currentTime;
              showToast('Press back again to exit');
            }
          } else {
            navigate(-1);
          }
        });
      };
      
      setupListener();
    }

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate]); // Only re-run if navigate function changes (rare)

  // For Web/PWA fallback: handle popstate if on home route
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const handlePopState = (e) => {
      if (homeRoutes.includes(currentPath.current)) {
        const currentTime = new Date().getTime();
        if (currentTime - lastBackPressTime.current < 2000) {
          window.history.back();
        } else {
          window.history.pushState(null, '', window.location.href);
          lastBackPressTime.current = currentTime;
          showToast('Press back again to exit');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial state block for home pages
    if (homeRoutes.includes(currentPath.current) && !window.history.state?.preventExit) {
        window.history.replaceState({ preventExit: true }, '', window.location.href);
        window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Run once on mount

  return null;
};

export default BackButtonHandler;
