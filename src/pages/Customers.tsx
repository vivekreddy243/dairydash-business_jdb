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
  address: string;
  milk_type: string;
  default_quantity: number;
  subscription_type: string;
  custom_delivery_notes: string;
  status: string;
}

interface Apartment {
  id: string;
  name: string;
}

export default function Customers() {
  const initialFormData = {
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
    custom_delivery_notes: '',
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApartment, setFilterApartment] = useState('');
  const [formError, setFormError] = useState('');
  const [supportsDeliveryOptions, setSupportsDeliveryOptions] = useState(true);

  const [formData, setFormData] = useState(initialFormData);

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
      let customersData:
        | Array<{
            id: string;
            name: string;
            phone: string;
            apartment_id: string;
            block: string;
            floor: string;
            flat_no: string;
            address: string;
            status: string;
            delivery_option?: string | null;
            custom_delivery_notes?: string | null;
          }>
        | null = null;

      const customerQueryWithDeliveryOptions = await supabase
        .from('customers')
        .select(
          'id, name, phone, apartment_id, block, floor, flat_no, address, status, delivery_option, custom_delivery_notes'
        )
        .order('created_at', { ascending: false });

      if (customerQueryWithDeliveryOptions.error) {
        const missingDeliveryOptionColumns =
          customerQueryWithDeliveryOptions.error.message.includes('delivery_option') ||
          customerQueryWithDeliveryOptions.error.message.includes('custom_delivery_notes');

        if (!missingDeliveryOptionColumns) {
          throw customerQueryWithDeliveryOptions.error;
        }

        setSupportsDeliveryOptions(false);

        const fallbackCustomerQuery = await supabase
          .from('customers')
          .select('id, name, phone, apartment_id, block, floor, flat_no, address, status')
          .order('created_at', { ascending: false });

        if (fallbackCustomerQuery.error) throw fallbackCustomerQuery.error;
        customersData = fallbackCustomerQuery.data;
      } else {
        setSupportsDeliveryOptions(true);
        customersData = customerQueryWithDeliveryOptions.data;
      }

      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('customer_id, milk_type, default_qty');

      if (subscriptionsError) throw subscriptionsError;

      const subscriptionByCustomer = new Map(
        (subscriptionsData || []).map((subscription) => [
          subscription.customer_id,
          subscription,
        ])
      );

      const mergedCustomers: Customer[] = (customersData || []).map((customer) => {
        const subscription = subscriptionByCustomer.get(customer.id);
        return {
          ...customer,
          milk_type: subscription?.milk_type || 'Regular',
          default_quantity: Number(subscription?.default_qty) || 1,
          subscription_type: customer.delivery_option || 'Daily',
          custom_delivery_notes: customer.custom_delivery_notes || '',
        };
      });

      setCustomers(mergedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormError('');
  };

  const getErrorMessage = (error: unknown) => {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      return 'A customer with this phone number already exists.';
    }

    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return 'Unable to save customer. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = formData.name.trim();
    const normalizedPhone = formData.phone.trim().replace(/\s+/g, '');
    const normalizedQuantity = Number(formData.default_quantity);

    if (!trimmedName) {
      setFormError('Name is required.');
      return;
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      setFormError('Phone number must be 10 digits.');
      return;
    }

    if (!formData.apartment_id) {
      setFormError('Please select an apartment.');
      return;
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      setFormError('Default quantity must be at least 1 liter.');
      return;
    }

    if (
      supportsDeliveryOptions &&
      formData.subscription_type === 'Custom' &&
      !formData.custom_delivery_notes.trim()
    ) {
      setFormError('Please add custom delivery notes or frequency details.');
      return;
    }

    setSaving(true);

    const customerPayload: {
      name: string;
      phone: string;
      apartment_id: string;
      block: string;
      floor: string;
      flat_no: string;
      address: string;
      status: string;
      delivery_option?: string;
      custom_delivery_notes?: string | null;
    } = {
      name: trimmedName,
      phone: normalizedPhone,
      apartment_id: formData.apartment_id,
      block: formData.block.trim(),
      floor: formData.floor.trim(),
      flat_no: formData.flat_no.trim(),
      address: formData.address.trim(),
      status: 'active',
    };

    if (supportsDeliveryOptions) {
      customerPayload.delivery_option = formData.subscription_type;
      customerPayload.custom_delivery_notes =
        formData.subscription_type === 'Custom'
          ? formData.custom_delivery_notes.trim()
          : null;
    }

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerPayload)
          .eq('id', editingCustomer.id);

        if (error) throw error;

        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert(
            {
              customer_id: editingCustomer.id,
              milk_type: formData.milk_type,
              default_qty: normalizedQuantity,
              is_active: true,
            },
            { onConflict: 'customer_id' }
          );

        if (subscriptionError) throw subscriptionError;
      } else {
        const { data: insertedCustomer, error } = await supabase
          .from('customers')
          .insert([customerPayload])
          .select('id')
          .single();

        if (error) throw error;
        if (!insertedCustomer?.id) {
          throw new Error('Customer created but failed to fetch created record.');
        }

        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert([
            {
              customer_id: insertedCustomer.id,
              milk_type: formData.milk_type,
              default_qty: normalizedQuantity,
              is_active: true,
            },
          ]);

        if (subscriptionError) {
          await supabase.from('customers').delete().eq('id', insertedCustomer.id);
          throw subscriptionError;
        }
      }

      setIsModalOpen(false);
      resetForm();
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
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
      address: customer.address || '',
      milk_type: customer.milk_type,
      default_quantity: customer.default_quantity,
      subscription_type: customer.subscription_type,
      custom_delivery_notes: customer.custom_delivery_notes || '',
    });
    setFormError('');
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
            resetForm();
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
          setFormError('');
        }}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          {!supportsDeliveryOptions && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Advanced delivery schedule fields are unavailable because your database is
              missing the latest customer delivery columns. Customers can still be added
              with the default daily schedule.
            </div>
          )}
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
                setFormData({
                  ...formData,
                  default_quantity: parseInt(e.target.value, 10) || 0,
                })
              }
              required
            />
          </div>

          {supportsDeliveryOptions && (
            <>
              <Select
                label="Subscription Type"
                options={[
                  { value: 'Daily', label: 'Daily' },
                  { value: 'Alternate Days', label: 'Alternate Days' },
                  { value: 'Weekly', label: 'Weekly' },
                  { value: 'Custom', label: 'Custom' },
                ]}
                value={formData.subscription_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription_type: e.target.value,
                    custom_delivery_notes:
                      e.target.value === 'Custom' ? formData.custom_delivery_notes : '',
                  })
                }
              />

              {formData.subscription_type === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Delivery Notes / Frequency Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Example: Deliver only Mon, Wed, Fri. Pause during travel dates."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.custom_delivery_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, custom_delivery_notes: e.target.value })
                    }
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setIsModalOpen(false);
                setEditingCustomer(null);
                setFormError('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCustomer ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
