import React, { useState } from 'react';
import { Menu, Database, RefreshCw, Bell, Warehouse, ChevronDown, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dataService } from '@/lib/data-service';
import { useQueryClient } from '@tanstack/react-query';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSidebar,
  pageTitle,
}) => {
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('dhaka');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleResetData = () => {
    if (confirm('Reset database to clean initial seed data? All custom additions will be restored to standard state.')) {
      setResetting(true);
      dataService.resetToSeed();
      queryClient.invalidateQueries();
      setTimeout(() => {
        setResetting(false);
      }, 400);
    }
  };

  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      desc: 'Fresh Soyabean Oil 5L is below minimum threshold (15 units remaining).',
      time: '10m ago',
    },
    {
      id: 2,
      type: 'success',
      title: 'Payment Received',
      desc: 'Received ৳25,000.00 from Beximco Pharma for Invoice INV-2026-002.',
      time: '1h ago',
    },
    {
      id: 3,
      type: 'info',
      title: 'PO Restocked',
      desc: 'Purchase Order PO-2026-001 inventory received at Central Hub.',
      time: '2h ago',
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Totally</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{pageTitle}</span>
          </div>
        </div>
      </div>

      {/* Right: Warehouse filter (from Screenshot 2), Currency, Reset, & Notifications */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Warehouse Selector (As seen in Screenshot 2) */}
        <div className="relative hidden md:block">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <Warehouse className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="dhaka">Central Hub (Dhaka)</option>
              <option value="chittagong">Port Depot (Chittagong)</option>
              <option value="all">All Warehouses & Depots</option>
            </select>
          </div>
        </div>

        {/* Backend State Indicator */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title={isSupabaseConfigured ? 'Connected to live Supabase Cloud database' : 'Running integrated transactional engine with PostgreSQL schema constraints'}
        >
          <Database className="w-3 h-3 text-emerald-600" />
          <span>{isSupabaseConfigured ? 'Supabase Live' : 'ACID Engine Active'}</span>
        </div>

        {/* Currency Tag */}
        <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          BDT (৳)
        </span>

        {/* Re-seed demo button */}
        <button
          onClick={handleResetData}
          disabled={resetting}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors bg-white shadow-2xs"
          title="Reset database to initial seed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline">Reset Seed</span>
        </button>

        {/* Notification Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
          </button>

          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Activity & Alerts</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      3 New
                    </span>
                  </div>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                    >
                      {n.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : n.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 border-t border-slate-100 text-center">
                  <span className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer">
                    Mark all alerts as resolved
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
