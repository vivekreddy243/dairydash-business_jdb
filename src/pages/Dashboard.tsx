import { useEffect, useState } from 'react';
import { Building2, Users, Truck, DollarSign } from 'lucide-react';
import Card from '../components/Card';
import { supabase } from '../lib/supabase';

interface Stats {
  totalApartments: number;
  totalCustomers: number;
  todayDeliveries: number;
  monthlyRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalApartments: 0,
    totalCustomers: 0,
    todayDeliveries: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [apartmentsRes, customersRes, deliveriesRes, settingsRes] = await Promise.all([
        supabase.from('apartments').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase
          .from('deliveries')
          .select('id', { count: 'exact', head: true })
          .eq('delivery_date', new Date().toISOString().split('T')[0]),
        supabase.from('settings').select('default_milk_price').maybeSingle(),
      ]);

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const { data: monthDeliveries } = await supabase
        .from('deliveries')
        .select('quantity')
        .gte('delivery_date', firstDayOfMonth)
        .eq('status', 'delivered');

      const totalLiters = monthDeliveries?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0;
      const price = settingsRes.data?.default_milk_price || 50;
      const revenue = totalLiters * Number(price);

      setStats({
        totalApartments: apartmentsRes.count || 0,
        totalCustomers: customersRes.count || 0,
        todayDeliveries: deliveriesRes.count || 0,
        monthlyRevenue: revenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Apartments',
      value: stats.totalApartments,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: "Today's Deliveries",
      value: stats.todayDeliveries,
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Revenue: ₹{stats.monthlyRevenue.toLocaleString()}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Deliveries Today: {stats.todayDeliveries}
          </div>
        </Card>
      </div>
    </div>
  );
}
