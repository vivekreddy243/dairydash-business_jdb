import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

interface TopCustomer {
  name: string;
  total_liters: number;
}

export default function Reports() {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pricePerLiter, setPricePerLiter] = useState(50);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('default_milk_price')
        .single();

      if (settingsData) {
        setPricePerLiter(Number(settingsData.default_milk_price));
      }

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const { data: deliveriesData } = await supabase
        .from('deliveries')
        .select('customer_id, quantity')
        .gte('delivery_date', firstDayOfMonth)
        .eq('status', 'delivered');

      if (deliveriesData) {
        const customerTotals: Record<string, number> = {};
        let totalLiters = 0;

        deliveriesData.forEach((d) => {
          totalLiters += d.quantity;
          customerTotals[d.customer_id] = (customerTotals[d.customer_id] || 0) + d.quantity;
        });

        setMonthlyRevenue(totalLiters * Number(settingsData?.default_milk_price || 50));

        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name');

        const topList: TopCustomer[] = customersData
          ?.filter((c) => customerTotals[c.id])
          .map((c) => ({
            name: c.name,
            total_liters: customerTotals[c.id],
          }))
          .sort((a, b) => b.total_liters - a.total_liters)
          .slice(0, 5) || [];

        setTopCustomers(topList);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = 'Customer Name,Total Liters\n' + topCustomers.map((c) => `${c.name},${c.total_liters}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top_customers.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-500">View business analytics and insights</p>
        </div>
        <Button onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-gray-500">Loading reports...</Card>
      ) : (
        <>
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h4>
            <div className="text-4xl font-bold text-blue-600">₹{monthlyRevenue.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-2">Current month revenue</p>
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Customers by Volume</h4>
            {topCustomers.length === 0 ? (
              <p className="text-gray-500">No delivery data available</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </span>
                      <span className="text-gray-900">{customer.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{customer.total_liters}L</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
