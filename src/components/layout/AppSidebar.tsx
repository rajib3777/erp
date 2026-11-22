import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Landmark,
  Users,
  Building2,
  Database,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/AuthContext';
import { UserRole } from '@/types';

interface AppSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, logout, switchRole, hasPermission } = useAuth();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' as const },
    { id: 'sales', name: 'Sales & Invoices', icon: ShoppingCart, module: 'sales' as const },
    { id: 'purchases', name: 'Purchases & POs', icon: Truck, module: 'purchases' as const },
    { id: 'inventory', name: 'Inventory & Stock', icon: Package, module: 'inventory' as const },
    { id: 'accounts', name: 'Accounts & Finance', icon: Landmark, module: 'accounts' as const },
    { id: 'customers', name: 'Customers', icon: Users, module: 'sales' as const },
    { id: 'suppliers', name: 'Suppliers', icon: Building2, module: 'purchases' as const },
    { id: 'settings', name: 'Database & SQL', icon: Database, module: 'settings' as const },
  ];

  const allowedNav = navigation.filter((item) =>
    item.id === 'settings' ? user?.role === 'admin' : hasPermission(item.module)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-900 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-900 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-base tracking-wider shadow-sm">
              N
            </div>
            <div>
              <span className="text-base font-semibold text-white tracking-tight">Nexus ERP</span>
              <span className="block text-[10px] text-slate-400 font-mono tracking-wider uppercase">Enterprise v1.0</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Core Modules
          </div>

          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Role Quick Switcher (Assessment feature) */}
        <div className="p-3 border-t border-slate-900 bg-slate-950/40">
          <label className="block text-[10px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Role Simulator:
            </span>
            <span className="font-mono text-indigo-400 uppercase text-[9px]">
              {user?.role.replace('_', ' ')}
            </span>
          </label>
          <select
            value={user?.role || 'admin'}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="admin">Admin (All Access)</option>
            <option value="manager">Manager (Operations)</option>
            <option value="accountant">Accountant (Finance & Ledgers)</option>
            <option value="sales_staff">Sales Staff (POS & Clients)</option>
            <option value="purchase_staff">Purchase Staff (Procurement)</option>
          </select>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-200">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
