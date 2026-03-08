import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Select } from '../components/Input';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
}

interface Apartment {
  id: string;
  name: string;
}

interface BillingRecord {
  date: string;
  quantity: number;
  status: string;
}

export default function Billing() {
  const [activeTab, setActiveTab] = useState<'customer' | 'apartment'>('customer');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedApartment, setSelectedApartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pricePerLiter, setPricePerLiter] = useState(50);

  useEffect(() => {
    fetchCustomers();
    fetchApartments();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('default_milk_price')
        .maybeSingle();
      if (data) {
        setPricePerLiter(Number(data.default_milk_price));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      setApartments(data || []);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const fetchCustomerBilling = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0);
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('deliveries')
        .select('delivery_date, quantity, status')
        .eq('customer_id', selectedCustomer)
        .gte('delivery_date', startDate)
        .lte('delivery_date', endDateStr)
        .order('delivery_date');

      if (error) throw error;
      setBillingData(
        data?.map((d) => ({
          date: d.delivery_date,
          quantity: d.quantity,
          status: d.status,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerBilling();
    }
  }, [selectedCustomer, selectedMonth, selectedYear]);

  const totalLiters = billingData.reduce((sum, record) => sum + record.quantity, 0);
  const deliveredDays = billingData.filter((r) => r.status === 'delivered').length;
  const skippedDays = billingData.filter((r) => r.status === 'skipped').length;
  const totalAmount = totalLiters * pricePerLiter;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Billing</h3>
        <p className="text-sm text-gray-500">Generate billing reports</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'customer'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Customer Billing
        </button>
        <button
          onClick={() => setActiveTab('apartment')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'apartment'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Apartment Billing
        </button>
      </div>

      {activeTab === 'customer' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Select Customer"
                options={[
                  { value: '', label: 'Choose a customer' },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              />
              <Select
                label="Month"
                options={months.map((m) => ({ value: String(m.value), label: m.label }))}
                value={String(selectedMonth)}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              />
              <Select
                label="Year"
                options={years.map((y) => ({ value: String(y), label: String(y) }))}
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </div>
          </Card>

          {selectedCustomer && !loading && (
            <>
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Billing Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Liters</p>
                    <p className="text-2xl font-bold text-gray-900">{totalLiters} L</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivered Days</p>
                    <p className="text-2xl font-bold text-green-600">{deliveredDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Skipped Days</p>
                    <p className="text-2xl font-bold text-red-600">{skippedDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-600">₹{totalAmount}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Price per Liter: <span className="font-medium">₹{pricePerLiter}</span>
                  </p>
                </div>
              </Card>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity (L)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {billingData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No deliveries found for this period
                          </td>
                        </tr>
                      ) : (
                        billingData.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  record.status === 'delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {record.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{record.quantity * pricePerLiter}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'apartment' && (
        <Card className="p-6">
          <div className="text-center text-gray-500 py-8">
            Apartment billing feature coming soon
          </div>
        </Card>
      )}
    </div>
  );
}
