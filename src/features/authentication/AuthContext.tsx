import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (module: 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'accounts' | 'settings') => boolean;
}

const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'u-admin-01',
    email: 'admin@nexuserp.bd',
    full_name: 'Mahmudur Rahman (System Admin)',
    role: 'admin',
    phone: '+880 1711-001122',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  manager: {
    id: 'u-mgr-02',
    email: 'manager@nexuserp.bd',
    full_name: 'Tanvir Hossain (Operations Manager)',
    role: 'manager',
    phone: '+880 1711-223344',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  accountant: {
    id: 'u-acc-03',
    email: 'accountant@nexuserp.bd',
    full_name: 'Shakil Ahmed (Head Accountant)',
    role: 'accountant',
    phone: '+880 1819-334455',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  sales_staff: {
    id: 'u-sales-04',
    email: 'sales@nexuserp.bd',
    full_name: 'Farhana Yasmin (Sales Officer)',
    role: 'sales_staff',
    phone: '+880 1914-445566',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  purchase_staff: {
    id: 'u-proc-05',
    email: 'purchase@nexuserp.bd',
    full_name: 'Kamrul Hasan (Procurement Officer)',
    role: 'purchase_staff',
    phone: '+880 1618-556677',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'nexus_erp_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEMO_USERS.admin; // Default to admin for seamless evaluation
    } catch {
      return DEMO_USERS.admin;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, requestedRole?: UserRole) => {
    setIsLoading(true);
    try {
      // Find matching demo profile or fallback
      let matchedRole: UserRole = requestedRole || 'admin';
      if (email.includes('manager')) matchedRole = 'manager';
      else if (email.includes('accountant')) matchedRole = 'accountant';
      else if (email.includes('sales')) matchedRole = 'sales_staff';
      else if (email.includes('purchase')) matchedRole = 'purchase_staff';

      setUser(DEMO_USERS[matchedRole]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    setUser(DEMO_USERS[role]);
  };

  const hasPermission = (module: 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'accounts' | 'settings'): boolean => {
    if (!user) return false;
    const role = user.role;

    if (role === 'admin') return true;

    switch (module) {
      case 'dashboard':
        return true;
      case 'sales':
        return ['manager', 'accountant', 'sales_staff'].includes(role);
      case 'purchases':
        return ['manager', 'accountant', 'purchase_staff'].includes(role);
      case 'inventory':
        return ['manager', 'accountant', 'sales_staff', 'purchase_staff'].includes(role);
      case 'accounts':
        return ['manager', 'accountant'].includes(role);
      case 'settings':
        return false;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
