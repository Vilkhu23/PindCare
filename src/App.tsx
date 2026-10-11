/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { BecomePartnerPage } from './pages/BecomePartnerPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { AdminPortal } from './pages/admin/AdminPortal';
import { VendorPortal } from './pages/vendor/VendorPortal';
import { EmployeePortal } from './pages/employee/EmployeePortal';

import { CartDrawer } from './components/customer/CartDrawer';
import { ServiceDetailModal } from './components/customer/ServiceDetailModal';
import { OrderTrackerModal } from './components/customer/OrderTrackerModal';
import { CustomRequirementModal } from './components/customer/CustomRequirementModal';
import { ProjectQuoteModal } from './components/customer/ProjectQuoteModal';
import { LocalitySelectorModal } from './components/customer/LocalitySelectorModal';
import { AuthModal } from './components/customer/AuthModal';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPage, toasts, dismissToast } = useApp();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'services':
        return <ServicesPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'how-it-works':
        return <HowItWorksPage />;
      case 'become-partner':
        return <BecomePartnerPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'account':
        return <CustomerAccountPage />;
      case 'admin':
        return <AdminPortal />;
      case 'vendor':
        return <VendorPortal />;
      case 'employee':
        return <EmployeePortal />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e] selection:bg-[#b6efd1] selection:text-[#002114]">
      {/* Toast Notification Container */}
      <div className="fixed top-14 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#131b2e] text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between text-xs font-semibold border border-white/10 animate-slideIn"
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#ffdad6]" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#ffdcc3]" />}
              {(!toast.type || toast.type === 'info') && <Info className="w-4 h-4 text-[#85bda1]" />}
              <span>{toast.text}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Header */}
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      {currentPage !== 'admin' && currentPage !== 'vendor' && currentPage !== 'employee' && <Footer />}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <ServiceDetailModal />
      <OrderTrackerModal />
      <CustomRequirementModal />
      <ProjectQuoteModal />
      <LocalitySelectorModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
