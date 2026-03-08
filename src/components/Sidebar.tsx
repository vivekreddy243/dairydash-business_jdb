import { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  DollarSign,
  BarChart3,
  Settings,
  Phone,
  MessageCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onContactClick: () => void;
}

export default function Sidebar({ currentPage, onPageChange, onContactClick }: SidebarProps) {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'apartments', label: 'Apartments', icon: Building2 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'deliveries', label: 'Deliveries', icon: Truck },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const customerMenuItems = [
    { id: 'my-deliveries', label: 'My Deliveries', icon: Truck },
    { id: 'my-billing', label: 'My Billing', icon: DollarSign },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : customerMenuItems;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 hover:bg-gray-100 rounded-lg lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">DairyDash</h1>
          <p className="text-xs text-gray-500 mt-1">
            {user?.role === 'admin' ? 'Admin Panel' : 'Customer Portal'}
          </p>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              onContactClick();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span className="text-sm">Contact Support</span>
          </button>

          <a
            href="https://wa.me/919921491249?text=Hello%2C%20I%20need%20help%20with%20DairyDash."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">WhatsApp Us</span>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
