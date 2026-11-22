import React, { useState } from 'react';
import { Lock, Mail, Shield, CheckCircle2, AlertCircle, Box } from 'lucide-react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@totally.bd');
  const [password, setPassword] = useState('Totally@2026');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter email and password');
      return;
    }
    await login(email);
  };

  const handleQuickDemoLogin = (role: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Totally@2026');
    login(demoEmail, role);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Headline — Totally */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/20 mb-3.5">
            <Box className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Totally</h1>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
              v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Modern Enterprise Cloud ERP Suite • Sales, Procurement, Inventory & Accounts
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-7 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@totally.bd"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 text-slate-600 font-medium cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400 font-medium">Security: PostgreSQL RLS</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all hover:-translate-y-0.5 mt-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="mt-7 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              1-Click Assessment Demo Roles:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin@totally.bd')}
                className="p-2.5 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all group"
              >
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">Admin</p>
                <p className="text-[10px] text-slate-400">Complete access</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('manager', 'manager@totally.bd')}
                className="p-2.5 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all group"
              >
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">Manager</p>
                <p className="text-[10px] text-slate-400">Sales/Purchase/Stock</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('accountant', 'accountant@totally.bd')}
                className="p-2.5 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all group"
              >
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">Accountant</p>
                <p className="text-[10px] text-slate-400">Finance & Ledgers</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sales_staff', 'sales@totally.bd')}
                className="p-2.5 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl text-left transition-all group"
              >
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">Sales Staff</p>
                <p className="text-[10px] text-slate-400">POS & Invoices</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Totally Trade & Distribution Ltd. • Technical Recruitment Assessment Build
        </p>
      </div>
    </div>
  );
};
