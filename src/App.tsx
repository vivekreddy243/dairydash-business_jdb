import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ContactModal from './components/ContactModal';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Apartments from './pages/Apartments';
import Customers from './pages/Customers';
import Deliveries from './pages/Deliveries';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

type PageType = 'dashboard' | 'apartments' | 'customers' | 'deliveries' | 'billing' | 'reports' | 'settings' | 'my-deliveries' | 'my-billing';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const pageTitle: Record<PageType, string> = {
    dashboard: 'Dashboard',
    apartments: 'Apartments',
    customers: 'Customers',
    deliveries: 'Deliveries',
    billing: 'Billing',
    reports: 'Reports',
    settings: 'Settings',
    'my-deliveries': 'My Deliveries',
    'my-billing': 'My Billing',
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'apartments':
        return <Apartments />;
      case 'customers':
        return <Customers />;
      case 'deliveries':
        return <Deliveries />;
      case 'billing':
        return <Billing />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'my-deliveries':
        return <Deliveries />;
      case 'my-billing':
        return <Billing />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onContactClick={() => setContactModalOpen(true)}
        />
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header title={pageTitle[currentPage]} />
          <main className="flex-1 overflow-y-auto p-8">
            {renderPage()}
          </main>
        </div>
      </div>
      <FloatingWhatsAppButton />
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AppContent />;
}

export default App;
