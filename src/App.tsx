import React, { useState, useEffect } from 'react';
import { PublicDisplayPage } from './pages/PublicDisplayPage';
import { AdminPage } from './pages/AdminPage';
import { TimerPage } from './pages/TimerPage';

export const App: React.FC = () => {
  const [route, setRoute] = useState<'display' | 'admin' | 'time'>(() => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash === '#admin' || pathname === '/admin') {
      return 'admin';
    }
    if (hash === '#time' || pathname === '/time' || hash === '#timer' || pathname === '/timer') {
      return 'time';
    }
    return 'display';
  });

  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      if (hash === '#admin' || pathname === '/admin') {
        setRoute('admin');
      } else if (hash === '#time' || pathname === '/time' || hash === '#timer' || pathname === '/timer') {
        setRoute('time');
      } else {
        setRoute('display');
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  if (route === 'admin') {
    return <AdminPage />;
  }

  if (route === 'time') {
    return <TimerPage />;
  }

  return <PublicDisplayPage />;
};

export default App;
