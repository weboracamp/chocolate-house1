/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { StoreFront } from './components/StoreFront';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AuthModal } from './components/AuthModal';
import { CashierDashboard } from './components/CashierDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, currentUser, toasts = [], dismissToast } = useStore();

  const renderView = () => {
    switch (activeView) {
      case 'owner':
        if (!currentUser || currentUser.role !== 'owner') {
          return <AuthModal requiredRole="owner" />;
        }
        return <OwnerDashboard />;

      case 'cashier':
        if (!currentUser || (currentUser.role !== 'cashier' && currentUser.role !== 'owner')) {
          return <AuthModal requiredRole="cashier" />;
        }
        return <CashierDashboard />;

      case 'store':
      default:
        return <StoreFront />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#2B140E] relative selection:bg-[#D4AF37] selection:text-[#1A0A06]">
      {/* Current Screen View */}
      {renderView()}

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <ReceiptModal />

      {/* Toast Notification Banners */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-md w-full px-4 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto px-4 py-2.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-bold w-full transition-all duration-300 ${
                toast.type === 'error'
                  ? 'bg-rose-900 text-white border-rose-700'
                  : toast.type === 'success'
                  ? 'bg-[#1A0A06] text-[#F7E7A9] border-[#D4AF37]'
                  : 'bg-[#2B140E] text-white border-[#D4AF37]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
