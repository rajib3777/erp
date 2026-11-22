import React from 'react';
import { Menu, Database, RefreshCw, Bell, CheckCircle2 } from 'lucide-react';
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
  const [resetting, setResetting] = React.useState(false);

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 lg:hidden rounded-md"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs text-slate-400 font-medium">Nexus ERP /</span>
          <h2 className="text-sm font-semibold text-slate-900">{pageTitle}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend State Indicator */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title={isSupabaseConfigured ? 'Connected to live Supabase Cloud database' : 'Running integrated transactional engine with PostgreSQL schema constraints'}
        >
          <Database className="w-3 h-3 text-slate-500" />
          <span>{isSupabaseConfigured ? 'Supabase Live' : 'Integrated ACID Engine'}</span>
        </div>

        {/* Currency Tag */}
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
          BDT (৳)
        </span>

        {/* Re-seed demo button */}
        <button
          onClick={handleResetData}
          disabled={resetting}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-md transition-colors bg-white shadow-2xs"
          title="Reset database to initial seed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Seed</span>
        </button>

        {/* Notification Icon */}
        <div className="relative p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
        </div>
      </div>
    </header>
  );
};
