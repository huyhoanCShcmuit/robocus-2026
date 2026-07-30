import React, { useState, useEffect } from 'react';
import { PublicDisplayPage } from './pages/PublicDisplayPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  const [route, setRoute] = useState<'display' | 'admin'>(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    if (hash === '#admin' || pathname === '/admin') {
      return 'admin';
    }
    return 'display';
  });

  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      if (hash === '#admin' || pathname === '/admin') {
        setRoute('admin');
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

  return <PublicDisplayPage />;
};

export default App;
