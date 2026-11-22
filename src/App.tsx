import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/features/authentication/AuthContext';
import { LoginView } from '@/features/authentication/LoginView';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { SalesView } from '@/features/sales/SalesView';
import { CreateSaleModal } from '@/features/sales/CreateSaleModal';
import { PurchasesView } from '@/features/purchases/PurchasesView';
import { CreatePurchaseModal } from '@/features/purchases/CreatePurchaseModal';
import { InventoryView } from '@/features/inventory/InventoryView';
import { AccountsView } from '@/features/accounts/AccountsView';
import { CustomersView } from '@/features/customers/CustomersView';
import { SuppliersView } from '@/features/suppliers/SuppliersView';
import { SettingsView } from '@/features/settings/SettingsView';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Quick Action Modal states accessible across the workspace
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isQuickPurchaseOpen, setIsQuickPurchaseOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'sales':
        return 'Sales & Invoices';
      case 'purchases':
        return 'Procurement & Purchases';
      case 'inventory':
        return 'Inventory & Stock Movements';
      case 'accounts':
        return 'Financial Accounts & Ledgers';
      case 'customers':
        return 'Customer Directory';
      case 'suppliers':
        return 'Supplier Directory';
      case 'settings':
        return 'Database Migrations & Verification';
      default:
        return 'Nexus ERP';
    }
  };

  return (
    <MainLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      pageTitle={getPageTitle()}
    >
      {currentTab === 'dashboard' && (
        <DashboardView
          onNavigate={setCurrentTab}
          onOpenCreateSale={() => setIsQuickSaleOpen(true)}
          onOpenCreatePurchase={() => setIsQuickPurchaseOpen(true)}
        />
      )}

      {currentTab === 'sales' && <SalesView />}
      {currentTab === 'purchases' && <PurchasesView />}
      {currentTab === 'inventory' && <InventoryView />}
      {currentTab === 'accounts' && <AccountsView />}
      {currentTab === 'customers' && <CustomersView />}
      {currentTab === 'suppliers' && <SuppliersView />}
      {currentTab === 'settings' && <SettingsView />}

      {/* Cross-workspace Quick Action Modals */}
      <CreateSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onSuccess={() => {
          setCurrentTab('sales');
        }}
      />

      <CreatePurchaseModal
        isOpen={isQuickPurchaseOpen}
        onClose={() => setIsQuickPurchaseOpen(false)}
        onSuccess={() => {
          setCurrentTab('purchases');
        }}
      />
    </MainLayout>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
