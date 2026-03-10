import { useEffect, useMemo, useState } from 'react';
import { Printer, Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  flat_no: string;
  apartment_id: string;
  milk_type: string;
  default_quantity: number;
}

interface Delivery {
  customer_id: string;
  delivery_date: string;
  quantity: number;
  status: string;
}

interface Apartment {
  id: string;
  name: string;
}

export default function Deliveries() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filterApartment, setFilterApartment] = useState('');
  const [fetchError, setFetchError] = useState('');

  const selectedApartmentName = useMemo(() => {
    if (!filterApartment) {
      return 'All Apartments';
    }

    return (
      apartments.find((apartment) => apartment.id === filterApartment)?.name ||
      'Selected Apartment'
    );
  }, [apartments, filterApartment]);

  const getErrorMessage = (error: unknown) => {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }
    return 'Something went wrong. Please try again.';
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchCustomersAndDeliveries();
    }
  }, [selectedDate, filterApartment]);

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

  const fetchCustomersAndDeliveries = async () => {
    setLoading(true);
    setFetchError('');

    try {
      let query = supabase
        .from('customers')
        .select('id, name, flat_no, apartment_id')
        .eq('status', 'active');

      if (filterApartment) {
        query = query.eq('apartment_id', filterApartment);
      }

      const { data: customersData, error: customersError } = await query;

      if (customersError) throw customersError;

      const customerIds = (customersData || []).map((customer) => customer.id);
      let subscriptionsData:
        | Array<{ customer_id: string; milk_type: string; default_qty: number }>
        | null = [];

      if (customerIds.length > 0) {
        const { data, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select('customer_id, milk_type, default_qty')
          .in('customer_id', customerIds);

        if (subscriptionsError) throw subscriptionsError;
        subscriptionsData = data;
      }

      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('customer_id, quantity, status, delivery_date')
        .eq('delivery_date', selectedDate);

      if (deliveriesError) throw deliveriesError;

      const subscriptionByCustomerId = new Map(
        (subscriptionsData || []).map((subscription) => [
          subscription.customer_id,
          subscription,
        ])
      );

      const normalizedCustomers: Customer[] = (customersData || []).map((customer) => {
        const subscription = subscriptionByCustomerId.get(customer.id);
        return {
          ...customer,
          milk_type: subscription?.milk_type || 'Regular',
          default_quantity: Number(subscription?.default_qty) || 1,
        };
      });

      const deliveriesMap: Record<string, Delivery> = {};
      deliveriesData?.forEach((d) => {
        deliveriesMap[d.customer_id] = {
          customer_id: d.customer_id,
          delivery_date: d.delivery_date,
          quantity: d.quantity,
          status: d.status,
        };
      });

      normalizedCustomers.forEach((c) => {
        if (!deliveriesMap[c.id]) {
          deliveriesMap[c.id] = {
            customer_id: c.id,
            delivery_date: selectedDate,
            quantity: c.default_quantity,
            status: 'pending',
          };
        }
      });

      setCustomers(normalizedCustomers);
      setDeliveries(deliveriesMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      setCustomers([]);
      setDeliveries({});
      setFetchError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const handleQuantityChange = (customerId: string, quantity: number) => {
    setDeliveries((prev) => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        quantity,
      },
    }));
  };

  const handleStatusToggle = (customerId: string) => {
    setDeliveries((prev) => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        status:
          prev[customerId].status === 'delivered' ? 'skipped' : 'delivered',
      },
    }));
  };

  const handleSave = async (customerId: string) => {
    try {
      const delivery = deliveries[customerId];
      if (!delivery) {
        throw new Error('No delivery data available for this customer.');
      }

      const { data: existing } = await supabase
        .from('deliveries')
        .select('id')
        .eq('customer_id', customerId)
        .eq('delivery_date', selectedDate)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('deliveries')
          .update({
            delivery_date: selectedDate,
            quantity: delivery.quantity,
            status: delivery.status,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('deliveries').insert([
          {
            customer_id: customerId,
            delivery_date: selectedDate,
            quantity: delivery.quantity,
            status: delivery.status,
          },
        ]);

        if (error) throw error;
      }

      alert('Delivery saved successfully!');
    } catch (error) {
      console.error('Error saving delivery:', error);
      alert(getErrorMessage(error));
    }
  };

  const handleMarkAllDelivered = () => {
    const updated: Record<string, Delivery> = {};
    Object.keys(deliveries).forEach((customerId) => {
      updated[customerId] = {
        ...deliveries[customerId],
        status: 'delivered',
      };
    });
    setDeliveries(updated);
  };

  const handleSaveAll = async () => {
    try {
      const deliveryRecords = Object.entries(deliveries).map(
        ([customerId, delivery]) => ({
          customer_id: customerId,
          delivery_date: selectedDate,
          quantity: delivery.quantity,
          status: delivery.status,
        })
      );

      if (deliveryRecords.length === 0) {
        alert('No delivery records available to save.');
        return;
      }

      const customerIds = deliveryRecords.map((record) => record.customer_id);
      const { error: deleteError } = await supabase
        .from('deliveries')
        .delete()
        .eq('delivery_date', selectedDate)
        .in('customer_id', customerIds);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('deliveries')
        .insert(deliveryRecords);

      if (insertError) throw insertError;

      alert('All deliveries saved successfully!');
      fetchCustomersAndDeliveries();
    } catch (error) {
      console.error('Error saving all deliveries:', error);
      alert(getErrorMessage(error));
    }
  };

  const handlePrintDeliveries = () => {
    window.print();
  };

  return (
    <div className="space-y-6 deliveries-print-root">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Deliveries</h3>
          <p className="text-sm text-gray-500">Manage daily deliveries</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <Button variant="secondary" onClick={handlePrintDeliveries}>
            <Printer className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
          <Button variant="secondary" onClick={handleMarkAllDelivered}>
            Mark All Delivered
          </Button>
          <Button onClick={handleSaveAll}>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      <Card className="p-4 print:hidden">
        <div className="flex gap-4">
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterApartment}
            onChange={(e) => setFilterApartment(e.target.value)}
          >
            <option value="">All Apartments</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                {apt.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="print:hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : fetchError ? (
          <div className="p-8 text-center text-red-600">{fetchError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Flat No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Milk Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity (L)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No deliveries found for the selected date and apartment.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const delivery = deliveries[customer.id];
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.flat_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.milk_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={delivery?.quantity || 0}
                            onChange={(e) =>
                              handleQuantityChange(
                                customer.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayDate(delivery?.delivery_date || selectedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleStatusToggle(customer.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              delivery?.status === 'delivered'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : delivery?.status === 'skipped'
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {delivery?.status?.toUpperCase() || 'PENDING'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => handleSave(customer.id)}
                          >
                            Save
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="hidden print:block">
        <div className="deliveries-print-sheet">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Delivery List</h1>
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-semibold text-gray-900">Date:</span>{' '}
                {formatDisplayDate(selectedDate)}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Apartment:</span>{' '}
                {selectedApartmentName}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Total Deliveries:</span>{' '}
                {customers.length}
              </p>
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Customer Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Flat No</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Milk Type</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Quantity (L)</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Delivery Date</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-gray-300 px-3 py-6 text-center text-gray-500"
                  >
                    No deliveries found for the selected date and apartment.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const delivery = deliveries[customer.id];

                  return (
                    <tr key={`print-${customer.id}`}>
                      <td className="border border-gray-300 px-3 py-2">{customer.name}</td>
                      <td className="border border-gray-300 px-3 py-2">{customer.flat_no}</td>
                      <td className="border border-gray-300 px-3 py-2">{customer.milk_type}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        {delivery?.quantity || 0}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {formatDisplayDate(delivery?.delivery_date || selectedDate)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 uppercase">
                        {delivery?.status || 'pending'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
