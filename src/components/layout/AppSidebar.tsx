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
  Box,
  Layers,
  ChevronRight,
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

  const navGroups = [
    {
      group: 'Platform',
      items: [
        { id: 'dashboard', name: 'Dashboard Insights', icon: LayoutDashboard, module: 'dashboard' as const },
      ],
    },
    {
      group: 'Operations',
      items: [
        { id: 'purchases', name: 'Purchase Orders', icon: Truck, module: 'purchases' as const },
        { id: 'sales', name: 'Sales & Invoices', icon: ShoppingCart, module: 'sales' as const },
        { id: 'inventory', name: 'Product Catalog & Stock', icon: Package, module: 'inventory' as const },
        { id: 'customers', name: 'Customer Profiles', icon: Users, module: 'sales' as const },
        { id: 'suppliers', name: 'Supplier Directory', icon: Building2, module: 'purchases' as const },
      ],
    },
    {
      group: 'Finance & Audit',
      items: [
        { id: 'accounts', name: 'Accounts & Ledgers', icon: Landmark, module: 'accounts' as const },
        { id: 'settings', name: 'Database & SQL Engine', icon: Database, module: 'settings' as const },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white text-slate-700 flex flex-col border-r border-slate-200/80 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo — "Totally" */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/25">
              <Box className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-slate-900 tracking-tight">Totally</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.2 rounded-full border border-emerald-200/70 font-mono">
                  v2.4
                </span>
              </div>
              <span className="block text-[10px] text-slate-400 font-medium tracking-tight">
                Enterprise Cloud Suite
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.id === 'settings' ? user?.role === 'admin' : hasPermission(item.module)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.group}
                </div>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all duration-150 group ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs shadow-emerald-600/25'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="tracking-tight">{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-100 opacity-80" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Role Simulator Card (Technical Assessment Feature) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Role Simulator
              </span>
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
            <select
              value={user?.role || 'admin'}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition-colors"
            >
              <option value="admin">Admin (All Access)</option>
              <option value="manager">Manager (Operations)</option>
              <option value="accountant">Accountant (Finance & Ledger)</option>
              <option value="sales_staff">Sales Staff (POS & Clients)</option>
              <option value="purchase_staff">Purchase Staff (Procurement)</option>
            </select>
          </div>
        </div>

        {/* User Profile Card (Matching Screenshot style) */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold border border-slate-200 shadow-2xs shrink-0">
              {user?.full_name?.charAt(0) || 'T'}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            title="Log Out of Totally"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
