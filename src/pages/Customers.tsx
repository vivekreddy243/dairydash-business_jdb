import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  phone: string;
  apartment_id: string;
  block: string;
  floor: string;
  flat_no: string;
  milk_type: string;
  default_quantity: number;
  subscription_type: string;
  status: string;
}

interface Apartment {
  id: string;
  name: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApartment, setFilterApartment] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    apartment_id: '',
    block: '',
    floor: '',
    flat_no: '',
    address: '',
    milk_type: 'Regular',
    default_quantity: 1,
    subscription_type: 'Daily',
  });

  useEffect(() => {
    fetchApartments();
    fetchCustomers();
  }, []);

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

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        apartment_id: '',
        block: '',
        floor: '',
        flat_no: '',
        address: '',
        milk_type: 'Regular',
        default_quantity: 1,
        subscription_type: 'Daily',
      });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer. Please try again.');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      apartment_id: customer.apartment_id,
      block: customer.block,
      floor: customer.floor,
      flat_no: customer.flat_no,
      address: '',
      milk_type: customer.milk_type,
      default_quantity: customer.default_quantity,
      subscription_type: customer.subscription_type,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);

      if (error) throw error;
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer. Please try again.');
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesApartment = !filterApartment || customer.apartment_id === filterApartment;
    return matchesSearch && matchesApartment;
  });

  const getApartmentName = (apartmentId: string) => {
    const apartment = apartments.find((a) => a.id === apartmentId);
    return apartment?.name || 'N/A';
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'apartment_id',
      label: 'Apartment',
      render: (value: unknown) => getApartmentName(value as string),
    },
    { key: 'block', label: 'Block' },
    { key: 'flat_no', label: 'Flat No' },
    { key: 'milk_type', label: 'Milk Type' },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {(value as string).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row as Customer)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id as string)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">All Customers</h3>
          <p className="text-sm text-gray-500">Manage customer accounts</p>
        </div>
        <Button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({
              name: '',
              phone: '',
              apartment_id: '',
              block: '',
              floor: '',
              flat_no: '',
              address: '',
              milk_type: 'Regular',
              default_quantity: 1,
              subscription_type: 'Daily',
            });
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <Table columns={columns} data={filteredCustomers} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              placeholder="Enter name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Phone"
              placeholder="Enter phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <Select
            label="Apartment"
            options={[
              { value: '', label: 'Select Apartment' },
              ...apartments.map((apt) => ({ value: apt.id, label: apt.name })),
            ]}
            value={formData.apartment_id}
            onChange={(e) => setFormData({ ...formData, apartment_id: e.target.value })}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Block"
              placeholder="A, B, C..."
              value={formData.block}
              onChange={(e) => setFormData({ ...formData, block: e.target.value })}
            />
            <Input
              label="Floor"
              placeholder="1, 2, 3..."
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            />
            <Input
              label="Flat No"
              placeholder="101, 102..."
              value={formData.flat_no}
              onChange={(e) => setFormData({ ...formData, flat_no: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Milk Type"
              options={[
                { value: 'Regular', label: 'Regular' },
                { value: 'Toned', label: 'Toned' },
                { value: 'Full Cream', label: 'Full Cream' },
              ]}
              value={formData.milk_type}
              onChange={(e) => setFormData({ ...formData, milk_type: e.target.value })}
            />
            <Input
              label="Default Quantity (Liters)"
              type="number"
              min="1"
              value={formData.default_quantity}
              onChange={(e) =>
                setFormData({ ...formData, default_quantity: parseInt(e.target.value) })
              }
              required
            />
          </div>

          <Select
            label="Subscription Type"
            options={[
              { value: 'Daily', label: 'Daily' },
              { value: 'Alternate Days', label: 'Alternate Days' },
              { value: 'Weekly', label: 'Weekly' },
            ]}
            value={formData.subscription_type}
            onChange={(e) => setFormData({ ...formData, subscription_type: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingCustomer(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCustomer ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
