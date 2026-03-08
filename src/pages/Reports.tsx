import { useEffect, useMemo, useState } from 'react';
import { Download, FileDown, Printer } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import { Select } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Apartment {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  flat_no: string;
  apartment_id: string;
}

interface Delivery {
  customer_id: string;
  quantity: number;
  status: string;
  delivery_date: string;
}

interface MonthlySummary {
  totalCustomers: number;
  totalDeliveries: number;
  totalLitersDelivered: number;
  totalSkippedDeliveries: number;
  estimatedMonthlyRevenue: number;
}

interface ApartmentReportRow {
  apartment_name: string;
  number_of_customers: number;
  total_liters: number;
  revenue: number;
}

interface CustomerBillingRow {
  customer_name: string;
  flat_no: string;
  total_quantity: number;
  total_amount: number;
  billing_month: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({
    totalCustomers: 0,
    totalDeliveries: 0,
    totalLitersDelivered: 0,
    totalSkippedDeliveries: 0,
    estimatedMonthlyRevenue: 0,
  });
  const [apartmentRows, setApartmentRows] = useState<ApartmentReportRow[]>([]);
  const [customerBillingRows, setCustomerBillingRows] = useState<CustomerBillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState(50);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedApartment, setSelectedApartment] = useState('');

  const monthLabel = useMemo(
    () =>
      new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [selectedMonth, selectedYear]
  );

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear, selectedApartment, apartments]);

  const getErrorMessage = (err: unknown) => {
    if (
      err &&
      typeof err === 'object' &&
      'message' in err &&
      typeof (err as { message?: string }).message === 'string'
    ) {
      return (err as { message: string }).message;
    }
    return 'Unable to load report data.';
  };

  const fetchApartments = async () => {
    try {
      const { data, error: apartmentsError } = await supabase
        .from('apartments')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (apartmentsError) throw apartmentsError;
      setApartments(data || []);
    } catch (err) {
      console.error('Error fetching apartments:', err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('default_milk_price')
        .maybeSingle();

      if (settingsData) {
        setPricePerLiter(Number(settingsData.default_milk_price));
      }
      const effectivePrice = Number(settingsData?.default_milk_price || 50);

      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0)
        .toISOString()
        .split('T')[0];

      let customerQuery = supabase
        .from('customers')
        .select('id, name, flat_no, apartment_id')
        .eq('status', 'active');

      if (selectedApartment) {
        customerQuery = customerQuery.eq('apartment_id', selectedApartment);
      }

      const { data: customersData, error: customersError } = await customerQuery;
      if (customersError) throw customersError;

      const customerIds = (customersData || []).map((customer) => customer.id);
      let deliveriesData: Delivery[] = [];

      if (customerIds.length > 0) {
        const { data, error: deliveriesError } = await supabase
          .from('deliveries')
          .select('customer_id, quantity, status, delivery_date')
          .in('customer_id', customerIds)
          .gte('delivery_date', startDate)
          .lte('delivery_date', endDate);

        if (deliveriesError) throw deliveriesError;
        deliveriesData = data || [];
      }

      const deliveredRows = deliveriesData.filter((row) => row.status === 'delivered');
      const skippedRows = deliveriesData.filter((row) => row.status === 'skipped');
      const totalLitersDelivered = deliveredRows.reduce(
        (sum, row) => sum + Number(row.quantity || 0),
        0
      );

      setSummary({
        totalCustomers: customerIds.length,
        totalDeliveries: deliveriesData.length,
        totalLitersDelivered,
        totalSkippedDeliveries: skippedRows.length,
        estimatedMonthlyRevenue: totalLitersDelivered * effectivePrice,
      });

      const customers = customersData || [];
      const deliveryByCustomer = new Map<string, Delivery[]>();
      deliveriesData.forEach((row) => {
        const list = deliveryByCustomer.get(row.customer_id) || [];
        list.push(row);
        deliveryByCustomer.set(row.customer_id, list);
      });

      const apartmentSource = selectedApartment
        ? apartments.filter((apartment) => apartment.id === selectedApartment)
        : apartments;

      const apartmentData: ApartmentReportRow[] = apartmentSource.map((apartment) => {
        const apartmentCustomers = customers.filter(
          (customer) => customer.apartment_id === apartment.id
        );
        const apartmentCustomerIds = new Set(
          apartmentCustomers.map((customer) => customer.id)
        );
        const apartmentDeliveredLiters = deliveredRows
          .filter((row) => apartmentCustomerIds.has(row.customer_id))
          .reduce((sum, row) => sum + Number(row.quantity || 0), 0);

        return {
          apartment_name: apartment.name,
          number_of_customers: apartmentCustomers.length,
          total_liters: apartmentDeliveredLiters,
          revenue: apartmentDeliveredLiters * effectivePrice,
        };
      });

      setApartmentRows(apartmentData);

      const customerData: CustomerBillingRow[] = customers
        .map((customer) => {
          const customerDeliveries = deliveryByCustomer.get(customer.id) || [];
          const deliveredQuantity = customerDeliveries
            .filter((row) => row.status === 'delivered')
            .reduce((sum, row) => sum + Number(row.quantity || 0), 0);

          return {
            customer_name: customer.name,
            flat_no: customer.flat_no || 'N/A',
            total_quantity: deliveredQuantity,
            total_amount: deliveredQuantity * effectivePrice,
            billing_month: monthLabel,
          };
        })
        .filter((row) => row.total_quantity > 0)
        .sort((a, b) => b.total_amount - a.total_amount);

      setCustomerBillingRows(customerData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(getErrorMessage(err));
      setSummary({
        totalCustomers: 0,
        totalDeliveries: 0,
        totalLitersDelivered: 0,
        totalSkippedDeliveries: 0,
        estimatedMonthlyRevenue: 0,
      });
      setApartmentRows([]);
      setCustomerBillingRows([]);
    } finally {
      setLoading(false);
    }
  };

  const apartmentColumns = [
    { key: 'apartment_name', label: 'Apartment Name' },
    { key: 'number_of_customers', label: 'Number of Customers' },
    { key: 'total_liters', label: 'Total Liters' },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (value: unknown) => `Rs ${Number(value || 0).toLocaleString()}`,
    },
  ];

  const customerBillingColumns = [
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'flat_no', label: 'Flat No' },
    { key: 'total_quantity', label: 'Total Quantity' },
    {
      key: 'total_amount',
      label: 'Total Amount',
      render: (value: unknown) => `Rs ${Number(value || 0).toLocaleString()}`,
    },
    { key: 'billing_month', label: 'Billing Month' },
  ];

  const handleExportCSV = () => {
    const summaryRows: string[][] = [
      ['Metric', 'Value'],
      ['Total Customers', String(summary.totalCustomers)],
      ['Total Deliveries', String(summary.totalDeliveries)],
      ['Total Liters Delivered', String(summary.totalLitersDelivered)],
      ['Total Skipped Deliveries', String(summary.totalSkippedDeliveries)],
      ['Estimated Monthly Revenue', String(summary.estimatedMonthlyRevenue)],
      [],
    ];

    const apartmentHeader: string[][] = [
      ['Apartment-wise Report'],
      ['Apartment Name', 'Number of Customers', 'Total Liters', 'Revenue'],
      ...apartmentRows.map((row) => [
        row.apartment_name,
        String(row.number_of_customers),
        String(row.total_liters),
        String(row.revenue),
      ]),
      [],
    ];

    const customerHeader: string[][] = [
      ['Customer-wise Billing Report'],
      ['Customer Name', 'Flat No', 'Total Quantity', 'Total Amount', 'Billing Month'],
      ...customerBillingRows.map((row) => [
        row.customer_name,
        row.flat_no,
        String(row.total_quantity),
        String(row.total_amount),
        row.billing_month,
      ]),
    ];

    const allRows = [...summaryRows, ...apartmentHeader, ...customerHeader];
    const csv = allRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdfDownload = () => {
    alert('PDF download is not configured yet. Please use Print or CSV export.');
  };

  if (user?.role !== 'admin') {
    return (
      <Card className="p-8 text-center text-gray-500">
        Reports are available for admin users only.
      </Card>
    );
  }

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 6 }, (_, idx) => {
    const year = new Date().getFullYear() - idx;
    return { value: String(year), label: String(year) };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-500">View business analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button variant="secondary" onClick={handlePdfDownload}>
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Month"
            options={months}
            value={String(selectedMonth)}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
          />
          <Select
            label="Year"
            options={years}
            value={String(selectedYear)}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          />
          <Select
            label="Apartment"
            options={[
              { value: '', label: 'All Apartments' },
              ...apartments.map((apartment) => ({
                value: apartment.id,
                label: apartment.name,
              })),
            ]}
            value={selectedApartment}
            onChange={(e) => setSelectedApartment(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-gray-500">Loading reports...</Card>
      ) : error ? (
        <Card className="p-8 text-center text-red-600">{error}</Card>
      ) : (
        <>
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalCustomers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalDeliveries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Liters Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalLitersDelivered}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Skipped Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalSkippedDeliveries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Monthly Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rs {summary.estimatedMonthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Billing month: {monthLabel} | Price per liter: Rs {pricePerLiter}
            </p>
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Apartment-wise Report</h4>
            <Table
              columns={apartmentColumns}
              data={apartmentRows as unknown as Record<string, unknown>[]}
            />
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer-wise Billing Report</h4>
            <Table
              columns={customerBillingColumns}
              data={customerBillingRows as unknown as Record<string, unknown>[]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
