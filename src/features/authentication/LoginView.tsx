import React, { useState } from 'react';
import { Lock, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@nexuserp.bd');
  const [password, setPassword] = useState('Nexus@2026');
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
    setPassword('Nexus@2026');
    login(demoEmail, role);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-2xl shadow-sm mb-3">
            N
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nexus ERP</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Wholesale & Distribution Management System
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexuserp.bd"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 text-slate-600">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400">Security: PostgreSQL RLS</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors mt-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-indigo-500" />
              1-Click Assessment Demo Roles:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin@nexuserp.bd')}
                className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-md text-left transition-colors"
              >
                <p className="font-semibold text-slate-900">Admin</p>
                <p className="text-[10px] text-slate-500">Complete access</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('manager', 'manager@nexuserp.bd')}
                className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-md text-left transition-colors"
              >
                <p className="font-semibold text-slate-900">Manager</p>
                <p className="text-[10px] text-slate-500">Sales/Purchase/Stock</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('accountant', 'accountant@nexuserp.bd')}
                className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-md text-left transition-colors"
              >
                <p className="font-semibold text-slate-900">Accountant</p>
                <p className="text-[10px] text-slate-500">Finance & Ledgers</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sales_staff', 'sales@nexuserp.bd')}
                className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-md text-left transition-colors"
              >
                <p className="font-semibold text-slate-900">Sales Staff</p>
                <p className="text-[10px] text-slate-500">POS & Invoices</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Nexus Trade & Distribution Ltd. • Technical Assessment Build
        </p>
      </div>
    </div>
  );
};
