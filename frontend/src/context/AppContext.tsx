'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  domain?: string;
  brand_colors?: {
    primary: string;
    secondary: string;
    background: string;
  };
  ai_tone?: string;
  support_email?: string;
  business_hours?: any;
  industry?: string;
}

interface User {
  id: string;
  clerk_id: string;
  email: string;
  role: 'admin' | 'employee' | 'customer';
  name: string;
  avatar_url?: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  company: Company | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  updateCompany: (updated: Partial<Company>) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const bootstrap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to bootstrap: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.company) {
        setCompany(data.company);
        localStorage.setItem('supportai_company_id', data.company.id);
      }
      if (data.user) {
        setUser(data.user);
      }
    } catch (err: any) {
      console.error('App bootstrap error:', err);
      setError(err.message || 'Failed to connect to support backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const updateCompany = (updated: Partial<Company>) => {
    if (company) {
      setCompany({ ...company, ...updated });
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider value={{ company, user, isLoading, error, bootstrap, updateCompany, toasts, showToast, removeToast }}>
      {children}
      
      {/* Toast Notifications Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none" style={{ zIndex: 99999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto p-4 rounded-xl border flex items-center justify-between shadow-2xl transition-all duration-300 backdrop-blur-md animate-fade-in"
            style={{
              background: t.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : t.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              borderColor: t.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : t.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              color: t.type === 'success' ? '#34d399' : t.type === 'error' ? '#fca5a5' : '#93c5fd'
            }}
          >
            <span className="text-xs font-bold leading-snug">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/40 hover:text-white text-xs ml-3 focus:outline-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
